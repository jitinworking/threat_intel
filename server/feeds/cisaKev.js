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

    const insert = db.prepare(`
      INSERT OR IGNORE INTO iocs (ioc, ioc_type, threat_type, threat_type_desc, malware, malware_printable, confidence_level, source, tags, first_seen)
      VALUES (?, 'cve', 'vulnerability', ?, ?, ?, 100, 'CISA KEV', ?, ?)
    `);

    let count = 0;
    const recent = json.vulnerabilities.slice(-200);
    const tx = db.transaction(() => {
      for (const vuln of recent) {
        try {
          const tags = [vuln.vendorProject, vuln.product].filter(Boolean);
          try {
            const result = insert.run(
              vuln.cveID,
              'cve',
              'vulnerability',
              vuln.shortDescription,
              vuln.vendorProject,
              vuln.product,
              100,
              'CISA KEV',
              JSON.stringify([vuln.vulnerabilityName]),
              vuln.dateAdded
            );
            count += result.changes;
          } catch (e) {}
        } catch (e) {}
      }
    });
    tx();

    db.prepare("UPDATE feeds SET last_polled = datetime('now') WHERE name = 'CISA KEV'").run();
    console.log(`[CISA KEV] Ingested ${count} new IoCs`);
    return count;
  } catch (err) {
    console.error('[CISA KEV] Error:', err.message);
    return 0;
  }
}
