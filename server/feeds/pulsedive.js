import fetch from 'node-fetch';
import { getDB } from '../db.js';

// Open-source indicator feed from PulseDive
export async function pollPulseDive() {
  const db = getDB();
  let imported = 0;

  try {
    // PulseDive has a free API, but for this demonstration, we use their public feeds
    const res = await fetch('https://pulsedive.com/feed/?type=ip&risk=high');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    
    // PulseDive RSS format
    const items = text.split('<item>');
    items.shift();

    const insert = db.prepare(`
      INSERT OR IGNORE INTO iocs (ioc, ioc_type, threat_type, malware_printable, confidence_level, source, first_seen)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    for (const item of items) {
      const ioc = (item.match(/<title>(.*?)<\/title>/s)?.[1] || '').trim();
      const type = ioc.includes('.') ? 'ipv4' : 'hash'; // Crude detection
      const malware = 'Unknown Campaign';
      
      if (ioc) {
        const result = insert.run(ioc, type, 'botnet', malware, 80, 'PulseDive');
        imported += result.changes;
      }
    }
    db.prepare("UPDATE feeds SET last_polled = datetime('now') WHERE name = 'PulseDive'").run();
  } catch (err) {
    console.error('[PulseDive] Error polling:', err.message);
  }

  return imported;
}
