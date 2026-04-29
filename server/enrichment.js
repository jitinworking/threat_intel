import fetch from 'node-fetch';
import { getDB } from './db.js';

// IoC Enrichment Engine
export async function enrichIoC(iocValue, iocType) {
  const db = getDB();
  const enrichment = {};

  try {
    // VirusTotal
    const vtRow = await db.execute("SELECT value FROM settings WHERE key = 'virustotal_api_key'");
    const vtKey = vtRow.rows[0]?.value;
    if (vtKey) {
      let vtUrl;
      if (iocType === 'sha256' || iocType === 'md5') {
        vtUrl = `https://www.virustotal.com/api/v3/files/${iocValue}`;
      } else if (iocType === 'domain') {
        vtUrl = `https://www.virustotal.com/api/v3/domains/${iocValue}`;
      } else if (iocType === 'ipv4') {
        vtUrl = `https://www.virustotal.com/api/v3/ip_addresses/${iocValue}`;
      } else if (iocType === 'url') {
        const urlId = Buffer.from(iocValue).toString('base64').replace(/=/g, '');
        vtUrl = `https://www.virustotal.com/api/v3/urls/${urlId}`;
      }

      if (vtUrl) {
        const res = await fetch(vtUrl, { headers: { 'x-apikey': vtKey } });
        if (res.ok) {
          const json = await res.json();
          const stats = json.data?.attributes?.last_analysis_stats;
          enrichment.virustotal = {
            malicious: stats?.malicious || 0,
            suspicious: stats?.suspicious || 0,
            harmless: stats?.harmless || 0,
            undetected: stats?.undetected || 0,
            reputation: json.data?.attributes?.reputation,
          };
        }
      }
    }

    // AbuseIPDB (IP only)
    const abuseRow = await db.execute("SELECT value FROM settings WHERE key = 'abuseipdb_api_key'");
    const abuseKey = abuseRow.rows[0]?.value;
    if (abuseKey && iocType === 'ipv4') {
      const res = await fetch(
        `https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(iocValue)}&maxAgeInDays=90`,
        { headers: { 'Key': abuseKey, 'Accept': 'application/json' } }
      );
      if (res.ok) {
        const json = await res.json();
        enrichment.abuseipdb = {
          abuseScore: json.data?.abuseConfidenceScore,
          totalReports: json.data?.totalReports,
          country: json.data?.countryCode,
          isp: json.data?.isp,
          domain: json.data?.domain,
        };
      }
    }

    // Shodan (IP only)
    const shodanRow = await db.execute("SELECT value FROM settings WHERE key = 'shodan_api_key'");
    const shodanKey = shodanRow.rows[0]?.value;
    if (shodanKey && iocType === 'ipv4') {
      const res = await fetch(`https://api.shodan.io/shodan/host/${iocValue}?key=${shodanKey}`);
      if (res.ok) {
        const json = await res.json();
        enrichment.shodan = {
          ports: json.ports || [],
          os: json.os,
          org: json.org,
          country: json.country_name,
          vulns: json.vulns || [],
        };
      }
    }

    // IP-API (Free GeoIP - no key required)
    if (iocType === 'ipv4') {
      const res = await fetch(`http://ip-api.com/json/${iocValue}?fields=status,message,country,countryCode,regionName,city,zip,lat,lon,isp,org,as,query`);
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'success') {
          enrichment.geoip = {
            country: json.country,
            countryCode: json.countryCode,
            city: json.city,
            region: json.regionName,
            isp: json.isp,
            lat: json.lat,
            lon: json.lon,
          };
        }
      }
    }

    // Store enrichment
    if (Object.keys(enrichment).length > 0) {
      await db.execute({
        sql: 'UPDATE iocs SET enrichment = ? WHERE ioc = ?',
        args: [JSON.stringify(enrichment), iocValue]
      });
    }
  } catch (e) {
    console.error('[Enrichment]', e.message);
  }

  return enrichment;
}

// Batch enrich recent unenriched IoCs
export async function enrichRecentIoCs(limit = 10) {
  const db = getDB();

  try {
    const vtRow = await db.execute("SELECT value FROM settings WHERE key = 'virustotal_api_key'");
    const abuseRow = await db.execute("SELECT value FROM settings WHERE key = 'abuseipdb_api_key'");
    const shodanRow = await db.execute("SELECT value FROM settings WHERE key = 'shodan_api_key'");

    const hasKeys = !!(vtRow.rows[0]?.value || abuseRow.rows[0]?.value || shodanRow.rows[0]?.value);
    
    const unenrichedRes = await db.execute({
      sql: "SELECT * FROM iocs WHERE enrichment = '{}' ORDER BY created_at DESC LIMIT ?",
      args: [limit]
    });
    const unenriched = unenrichedRes.rows;

    if (!hasKeys && !unenriched.some(i => i.ioc_type === 'ipv4')) {
      console.log('[Enrichment] No API keys and no IPv4s to enrich. Skipping.');
      return 0;
    }

    let count = 0;
    for (const ioc of unenriched) {
      await enrichIoC(ioc.ioc, ioc.ioc_type);
      count++;
      await new Promise(r => setTimeout(r, 500));
    }

    if (count > 0) console.log(`[Enrichment] Enriched ${count} IoCs`);
    return count;
  } catch (err) {
    console.error('[Enrichment] Error:', err.message);
    return 0;
  }
}
