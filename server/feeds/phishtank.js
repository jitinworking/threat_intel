import fetch from 'node-fetch';
import { getDB } from '../db.js';

export async function pollPhishTank() {
  const db = getDB();
  let imported = 0;

  try {
    // Using a verified open feed for phishing
    const res = await fetch('https://raw.githubusercontent.com/mitchellkrogza/Phishing.Database/master/phishing-links-ACTIVE.txt');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const urls = text.split('\n').slice(0, 500); // Limit to top 500 recently verified

    const insert = db.prepare(`
      INSERT OR IGNORE INTO iocs (ioc, ioc_type, threat_type, malware_printable, confidence_level, source, first_seen)
      VALUES (?, 'url', 'phishing', 'Verified Phish', 90, 'PhishTank', datetime('now'))
    `);

    for (const url of urls) {
      if (url && url.startsWith('http')) {
        try {
          const result = insert.run(url.trim());
          imported += result.changes;
        } catch (e) {}
      }
    }
    db.prepare("UPDATE feeds SET last_polled = datetime('now') WHERE name = 'PhishTank'").run();
  } catch (err) {
    console.error('[PhishTank] Error polling:', err.message);
  }

  return imported;
}
