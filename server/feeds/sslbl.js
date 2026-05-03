import fetch from 'node-fetch';
import { getDB } from '../db.js';

export async function pollSSLBL() {
  const db = getDB();
  try {
    // SSL Blacklist (SSLBL) recent certificates
    const res = await fetch('https://sslbl.abuse.ch/blacklist/sslblacklist.csv', {
      headers: { 'Accept': 'text/csv' },
    });

    if (!res.ok) {
      console.warn(`[SSLBL] HTTP Error: ${res.status}`);
      return 0;
    }

    const text = await res.text();
    const lines = text.split('\n').filter(l => l && !l.startsWith('#'));

    const insertSql = `
      INSERT INTO iocs (ioc, ioc_type, threat_type, threat_type_desc, malware, malware_printable, confidence_level, source, tags, first_seen)
      VALUES (?, 'ssl_cert_sha1', 'malicious_ssl', ?, ?, ?, 90, 'SSLBL', '["abuse.ch", "sslbl"]', ?)
      ON CONFLICT(ioc, source) DO UPDATE SET last_seen = datetime('now'), confidence_level = MIN(100, confidence_level + 10)
    `;

    let count = 0;
    const batch = [];
    // begin batch
      for (const line of lines) {
        // Format: Listingdate,SHA1desc,Common Name
        const parts = line.split(',');
        if (parts.length < 3) continue;

        const firstSeen = parts[0];
        const sha1 = parts[1];
        const malware = parts[2] || 'Unknown';

        try {
          batch.push({ sql: insertSql, args: [
            sha1,
            `Malicious SSL Certificate (${malware})`,
            malware,
            malware,
            firstSeen
          ] });
            count++;
        } catch (e) { /* duplicate */ }
      }
    if (batch.length > 0) {
      try {
        await db.batch(batch, 'write');
      } catch (e) { /* ignore batch errors */ }
    }

    await db.execute("UPDATE feeds SET last_polled = datetime('now') WHERE name = 'SSLBL'");
    console.log(`[SSLBL] Ingested ${count} new malicious certificates`);
    return count;
  } catch (err) {
    console.error('[SSLBL] Error:', err.message);
    return 0;
  }
}
