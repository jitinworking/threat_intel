import fetch from 'node-fetch';
import { getDB } from '../db.js';

export async function pollCisaKev() {
  const db = getDB();
  try {
    const res = await fetch('https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json');
    const json = await res.json();

    if (!json.vulnerabilities) {
      console.warn('[CISA] No vulnerabilities found');
      return 0;
    }

    const insertSql = `
      INSERT INTO cves (id, score, severity, description, vendor, product, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET description = excluded.description
    `;

    let count = 0;
    const recent = json.vulnerabilities.slice(-200);
    const batch = [];
    // begin batch
      for (const vuln of recent) {
        try {
          try {
            batch.push({ sql: insertSql, args: [
              vuln.cveID,
              9.8, // CISA KEV implies critical/high, could map if CVSS available
              'critical', 
              vuln.shortDescription,
              vuln.vendorProject,
              vuln.product,
              vuln.dateAdded
            ] });
            count++;
          } catch (e) {}
        } catch (e) {}
      }
    if (batch.length > 0) {
      try {
        await db.batch(batch, 'write');
      } catch (e) { /* ignore batch errors */ }
    }

    await db.execute("UPDATE feeds SET last_polled = datetime('now') WHERE name = 'CISA KEV'");
    console.log(`[CISA KEV] Ingested ${count} new IoCs`);
    return count;
  } catch (err) {
    console.error('[CISA KEV] Error:', err.message);
    return 0;
  }
}
