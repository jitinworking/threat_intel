import fetch from 'node-fetch';
import { getDB } from '../db.js';

export async function pollURLhaus() {
  const db = getDB();
  try {
    // URLhaus bulk JSON export — returns a dict keyed by URL ID
    const res = await fetch('https://urlhaus.abuse.ch/downloads/json_recent/', {
      headers: { 'Accept': 'application/json' },
    });

    const json = await res.json();

    // The response is an object { urlId: [{ url, threat, tags, dateadded, ... }] }
    if (!json || typeof json !== 'object') {
      console.warn('[URLhaus] Unexpected response format');
      return 0;
    }

    const insertSql = `
      INSERT INTO iocs (ioc, ioc_type, threat_type, threat_type_desc, malware, malware_printable, confidence_level, source, tags, first_seen)
      VALUES (?, 'url', 'payload_delivery', 'Malicious URL', ?, ?, 85, 'URLhaus', ?, ?)
      ON CONFLICT(ioc, source) DO UPDATE SET last_seen = datetime('now'), confidence_level = MIN(100, confidence_level + 10)
    `;

    let count = 0;
    const entries = Object.values(json);
    const batch = [];
    // begin batch
      // Take the 200 most recent
      for (const itemArr of entries.slice(0, 200)) {
        const item = Array.isArray(itemArr) ? itemArr[0] : itemArr;
        if (!item || !item.url) continue;
        try {
          const tags = item.tags || [];
          const threat = item.threat || (tags.length > 0 ? tags[0] : 'unknown');
          batch.push({ sql: insertSql, args: [
            item.url, threat, threat,
            JSON.stringify(tags),
            item.dateadded || ''
          ] });
            count++;
        } catch (e) {}
      }
    if (batch.length > 0) {
      try {
        await db.batch(batch, 'write');
      } catch (e) { /* ignore batch errors */ }
    }

    await db.execute("UPDATE feeds SET last_polled = datetime('now') WHERE name = 'URLhaus'");
    console.log(`[URLhaus] Ingested ${count} new IoCs`);
    return count;
  } catch (err) {
    console.error('[URLhaus] Error:', err.message);
    return 0;
  }
}
