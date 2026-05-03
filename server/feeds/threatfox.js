import fetch from 'node-fetch';
import { getDB } from '../db.js';

export async function pollThreatFox() {
  const db = getDB();
  try {
    // Use the public JSON bulk export — the signed API key endpoints require paid access
    const res = await fetch('https://threatfox.abuse.ch/export/json/recent/', {
      headers: { 'Accept': 'application/json' },
    });

    const json = await res.json();

    if (!json || typeof json !== 'object') {
      console.warn('[ThreatFox] Unexpected response format');
      return 0;
    }

    const insertSql = `
      INSERT INTO iocs (ioc, ioc_type, threat_type, threat_type_desc, malware, malware_printable, confidence_level, source, tags, first_seen)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'ThreatFox', ?, ?)
      ON CONFLICT(ioc, source) DO UPDATE SET last_seen = datetime('now'), confidence_level = MIN(100, confidence_level + 10)
    `;

    let count = 0;
    const batch = [];
    // begin batch
      for (const [id, items] of Object.entries(json)) {
        if (!Array.isArray(items)) continue;
        for (const item of items) {
          try {
            batch.push({ sql: insertSql, args: [
              item.ioc_value,
              item.ioc_type || 'unknown',
              item.threat_type || '',
              item.threat_type_desc || '',
              item.malware || '',
              item.malware_printable || item.malware || '',
              item.confidence_level || 50,
              JSON.stringify(item.tags || []),
              item.first_seen || ''
            ] });
            count++;
          } catch (e) { /* duplicate, skip */ }
        }
      }
    if (batch.length > 0) {
      try {
        await db.batch(batch, 'write');
      } catch (e) { /* ignore batch errors */ }
    }

    await db.execute("UPDATE feeds SET last_polled = datetime('now') WHERE name = 'ThreatFox'");
    console.log(`[ThreatFox] Ingested ${count} new IoCs`);
    return count;
  } catch (err) {
    console.error('[ThreatFox] Error:', err.message);
    return 0;
  }
}
