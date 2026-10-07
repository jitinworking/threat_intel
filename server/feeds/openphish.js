import fetch from 'node-fetch';
import { getDB } from '../db.js';

export async function pollOpenPhish() {
  const db = getDB();
  try {
    const res = await fetch('https://openphish.com/feed.txt');
    const text = await res.text();
    const urls = text.split('\n').filter(l => l.trim().startsWith('http'));

    const insert = db.prepare(`
      INSERT OR IGNORE INTO iocs (ioc, ioc_type, threat_type, threat_type_desc, malware, malware_printable, confidence_level, source, tags)
      VALUES (?, 'url', 'phishing', 'Phishing URL', 'phishing', 'Phishing', 80, 'OpenPhish', '["phishing"]')
    `);

    let count = 0;
    const tx = db.transaction(() => {
      for (const url of urls.slice(0, 200)) {
        try {
          const result = insert.run(url.trim());
          count += result.changes;
        } catch (e) {}
      }
    });
    tx();

    db.prepare("UPDATE feeds SET last_polled = datetime('now') WHERE name = 'OpenPhish'").run();
    console.log(`[OpenPhish] Ingested ${count} new IoCs`);
    return count;
  } catch (err) {
    console.error('[OpenPhish] Error:', err.message);
    return 0;
  }
}
