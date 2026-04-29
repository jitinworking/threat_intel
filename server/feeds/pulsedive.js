import fetch from 'node-fetch';
import { getDB } from '../db.js';

// Open-source indicator feed from PulseDive
export async function pollPulseDive() {
  const db = getDB();
  let imported = 0;

  try {
    // PulseDive has a free API, but for this demonstration, we use their public feeds
    const res = await fetch('https://pulsedive.com/feed/?type=ip&risk=high');
    const text = await res.text();
    
    // PulseDive RSS format
    const items = text.split('<item>');
    items.shift();

    const insertSql = `
      INSERT OR IGNORE INTO iocs (ioc, ioc_type, threat_type, malware_printable, confidence_level, source, first_seen)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `;

    for (const item of items) {
      const ioc = (item.match(/<title>(.*?)<\/title>/s)?.[1] || '').trim();
      const type = ioc.includes('.') ? 'ipv4' : 'hash'; // Crude detection
      const malware = 'Unknown Campaign';
      
      if (ioc) {
        const result = batch.push({ sql: insertSql, args: [ioc, type, 'botnet', malware, 80, 'PulseDive'] });
        imported += result.changes;
      }
    }
  } catch (err) {
    console.error('[PulseDive] Error polling:', err.message);
  }

  return imported;
}
