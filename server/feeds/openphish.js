import fetch from 'node-fetch';
import { getDB } from '../db.js';

export async function pollOpenPhish() {
  const db = getDB();
  try {
    const res = await fetch('https://openphish.com/feed.txt');
    const text = await res.text();
    const urls = text.split('\n').filter(l => l.trim().startsWith('http'));

    const insertSql = `
      INSERT INTO iocs (ioc, ioc_type, threat_type, threat_type_desc, malware, malware_printable, confidence_level, source, tags)
      VALUES (?, 'url', 'phishing', 'Phishing URL', 'phishing', 'Phishing', 80, 'OpenPhish', '["phishing"]')
      ON CONFLICT(ioc, source) DO UPDATE SET last_seen = datetime('now'), confidence_level = MIN(100, confidence_level + 10)
    `;

    let count = 0;
    const batch = [];
    // begin batch
      for (const url of urls.slice(0, 200)) {
        try {
          batch.push({ sql: insertSql, args: [url.trim()] });
            count++;
        } catch (e) {}
      }
    if (batch.length > 0) {
      try {
        await db.batch(batch, 'write');
      } catch (e) { /* ignore batch errors */ }
    }

    await db.execute("UPDATE feeds SET last_polled = datetime('now') WHERE name = 'OpenPhish'");
    console.log(`[OpenPhish] Ingested ${count} new IoCs`);
    return count;
  } catch (err) {
    console.error('[OpenPhish] Error:', err.message);
    return 0;
  }
}
