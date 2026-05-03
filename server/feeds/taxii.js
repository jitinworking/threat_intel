import fetch from 'node-fetch';
import { getDB } from '../db.js';

// TAXII 2.1 client for AlienVault OTX (free with API key)
export async function pollTaxii() {
  const db = getDB();
  let apiKey = null;

  try {
    const res = await db.execute("SELECT value FROM settings WHERE key = 'otx_api_key'");
    apiKey = res.rows.length > 0 ? res.rows[0].value : null;
  } catch(e) {}

  if (!apiKey) {
    console.log('[TAXII/OTX] No API key configured. Skipping.');
    return 0;
  }

  let totalCount = 0;

  try {
    // AlienVault OTX API — get recent pulses (threat reports with IoCs)
    const res = await fetch('https://otx.alienvault.com/api/v1/pulses/subscribed?limit=20&modified_since=1d', {
      headers: { 'X-OTX-API-KEY': apiKey },
    });

    if (!res.ok) {
      console.warn(`[TAXII/OTX] API error: ${res.status}`);
      return 0;
    }

    const json = await res.json();
    if (!json.results) return 0;

    const insertSql = `
      INSERT INTO iocs (ioc, ioc_type, threat_type, threat_type_desc, malware, malware_printable, confidence_level, source, tags, first_seen)
      VALUES (?, ?, 'stix_indicator', 'STIX/TAXII Indicator', ?, ?, 85, 'AlienVault OTX', ?, ?)
      ON CONFLICT(ioc, source) DO UPDATE SET last_seen = datetime('now'), confidence_level = MIN(100, confidence_level + 10)
    `;

    const batch = [];
    // begin batch
      for (const pulse of json.results) {
        const pulseName = pulse.name || 'Unknown Pulse';
        const tags = pulse.tags || [];

        for (const indicator of (pulse.indicators || [])) {
          try {
            let iocType = 'unknown';
            if (indicator.type === 'IPv4') iocType = 'ipv4';
            else if (indicator.type === 'domain') iocType = 'domain';
            else if (indicator.type === 'URL') iocType = 'url';
            else if (indicator.type === 'FileHash-SHA256') iocType = 'sha256';
            else if (indicator.type === 'FileHash-MD5') iocType = 'md5';
            else if (indicator.type === 'email') iocType = 'email';
            else if (indicator.type === 'CVE') iocType = 'cve';
            else iocType = indicator.type || 'unknown';

            batch.push({ sql: insertSql, args: [
              indicator.indicator, iocType,
              pulseName, pulseName,
              JSON.stringify(tags.slice(0, 5)),
              indicator.created || ''
            ] });
            totalCount++;
          } catch (e) {}
        }
      }
    if (batch.length > 0) {
      try {
        await db.batch(batch, 'write');
      } catch (e) { /* ignore batch errors */ }
    }

  } catch (err) {
    console.error('[TAXII/OTX] Error:', err.message);
  }

  console.log(`[TAXII/OTX] Ingested ${totalCount} new IoCs from AlienVault OTX`);
  return totalCount;
}
