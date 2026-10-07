import fetch from 'node-fetch';
import { getDB } from './db.js';

// IoC Enrichment Engine
// Queries external APIs to add context to IoCs
export async function enrichIoC(iocValue, iocType) {
  const db = getDB();
  const enrichment = {};

  // VirusTotal
  const vtRow = db.prepare("SELECT value FROM settings WHERE key = 'virustotal_api_key'").get();
  if (vtRow?.value) {
    try {
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
        const res = await fetch(vtUrl, {
          headers: { 'x-apikey': vtRow.value },
        });
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
    } catch (e) { console.error('[Enrichment/VT]', e.message); }
  }

  // AbuseIPDB (IP only)
  const abuseRow = db.prepare("SELECT value FROM settings WHERE key = 'abuseipdb_api_key'").get();
  if (abuseRow?.value && iocType === 'ipv4') {
    try {
      const res = await fetch(
        `https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(iocValue)}&maxAgeInDays=90`,
        { headers: { 'Key': abuseRow.value, 'Accept': 'application/json' } }
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
    } catch (e) { console.error('[Enrichment/AbuseIPDB]', e.message); }
  }

  // Shodan (IP only)
  const shodanRow = db.prepare("SELECT value FROM settings WHERE key = 'shodan_api_key'").get();
  if (shodanRow?.value && iocType === 'ipv4') {
    try {
      const res = await fetch(`https://api.shodan.io/shodan/host/${iocValue}?key=${shodanRow.value}`);
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
    } catch (e) { console.error('[Enrichment/Shodan]', e.message); }
  }

  // IP-API (Free GeoIP - no key required)
  if (iocType === 'ipv4') {
    try {
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
    } catch (e) { console.error('[Enrichment/IP-API]', e.message); }
  }

  // Store enrichment
  if (Object.keys(enrichment).length > 0) {
    db.prepare('UPDATE iocs SET enrichment = ? WHERE ioc = ?')
      .run(JSON.stringify(enrichment), iocValue);
  }

  return enrichment;
}

// Batch enrich recent unenriched IoCs
export async function enrichRecentIoCs(limit = 10) {
  const db = getDB();

  // Check if any enrichment API keys are configured
  const vtKey = db.prepare("SELECT value FROM settings WHERE key = 'virustotal_api_key'").get();
  const abuseKey = db.prepare("SELECT value FROM settings WHERE key = 'abuseipdb_api_key'").get();
  const shodanKey = db.prepare("SELECT value FROM settings WHERE key = 'shodan_api_key'").get();

  // We allow enrichment if any key is present OR if we have IPv4s to enrich via IP-API
  const hasKeys = !!(vtKey?.value || abuseKey?.value || shodanKey?.value);
  
  const unenriched = db.prepare(
    "SELECT * FROM iocs WHERE enrichment = '{}' ORDER BY created_at DESC LIMIT ?"
  ).all(limit);

  if (!hasKeys && !unenriched.some(i => i.ioc_type === 'ipv4')) {
    console.log('[Enrichment] No API keys and no IPv4s to enrich. Skipping.');
    return 0;
  }

  let count = 0;
  for (const ioc of unenriched) {
    await enrichIoC(ioc.ioc, ioc.ioc_type);
    count++;
    // Rate limit: 500ms between calls
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`[Enrichment] Enriched ${count} IoCs`);
  return count;
}
