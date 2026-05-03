import fetch from 'node-fetch';
import { getDB } from '../db.js';

export async function pollFeodoTracker() {
  const db = getDB();
  try {
    const res = await fetch('https://feodotracker.abuse.ch/downloads/ipblocklist_recommended.txt');
    const text = await res.text();
    const lines = text.split('\n').filter(l => l.trim() && !l.startsWith('#'));

    const insertSql = `
      INSERT INTO iocs (ioc, ioc_type, threat_type, threat_type_desc, malware, malware_printable, confidence_level, source, tags)
      VALUES (?, 'ipv4', 'botnet_cc', 'Botnet C&C Server', 'feodo', 'Feodo/Dridex/Emotet', 90, 'Feodo Tracker', '["botnet","c2"]')
      ON CONFLICT(ioc, source) DO UPDATE SET last_seen = datetime('now'), confidence_level = MIN(100, confidence_level + 10)
    `;

    let count = 0;
    const batch = [];
    // begin batch
      for (const ip of lines) {
        try {
          const cleaned = ip.trim();
          if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(cleaned)) {
            batch.push({ sql: insertSql, args: [cleaned] });
            count++;
          }
        } catch (e) {}
      }
    if (batch.length > 0) {
      try {
        await db.batch(batch, 'write');
      } catch (e) { /* ignore batch errors */ }
    }

    await db.execute("UPDATE feeds SET last_polled = datetime('now') WHERE name = 'Feodo Tracker'");
    console.log(`[Feodo] Ingested ${count} new IoCs`);
    return count;
  } catch (err) {
    console.error('[Feodo] Error:', err.message);
    return 0;
  }
}
