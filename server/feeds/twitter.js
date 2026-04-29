import fetch from 'node-fetch';
import { getDB } from '../db.js';

// Twitter/X requires API keys (Bearer Token)
// This adapter checks settings and gracefully skips if no key is configured
export async function pollTwitter() {
  const db = getDB();
  const row = db.prepare("SELECT value FROM settings WHERE key = 'twitter_bearer_token'").get();
  const token = row?.value;

  if (!token) {
    console.log('[Twitter] No bearer token configured. Skipping.');
    return 0;
  }

  const queries = ['#IOC', '#malware', '#threatintel', '#APT'];
  let totalCount = 0;

  for (const query of queries) {
    try {
      const res = await fetch(
        `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=50&tweet.fields=created_at,text`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (!res.ok) {
        console.warn(`[Twitter] API error for "${query}": ${res.status}`);
        continue;
      }

      const json = await res.json();
      if (!json.data) continue;

      const insertSql = `
        INSERT OR IGNORE INTO iocs (ioc, ioc_type, threat_type, threat_type_desc, malware, malware_printable, confidence_level, source, tags, first_seen)
        VALUES (?, ?, 'social_intel', 'Twitter Intel', ?, ?, 55, 'Twitter', ?, ?)
      `;

      const batch = [];
    // begin batch
        for (const tweet of json.data) {
          const text = tweet.text || '';
          const sha256s = text.match(/\b[A-Fa-f0-9]{64}\b/g) || [];
          const ips = text.match(/\b(?:\d{1,3}(?:\[\.\]|\.)){3}\d{1,3}\b/g) || [];
          const domains = text.match(/[a-zA-Z0-9-]+\[\.\][a-zA-Z]{2,}/g) || [];

          const all = [
            ...sha256s.map(h => ({ ioc: h, type: 'sha256' })),
            ...ips.map(ip => ({ ioc: ip.replace(/\[\.\]/g, '.'), type: 'ipv4' })),
            ...domains.map(d => ({ ioc: d.replace(/\[\.\]/g, '.'), type: 'domain' })),
          ];

          for (const item of all) {
            try {
              batch.push({ sql: insertSql, args: [item.ioc, item.type, 'twitter', 'twitter', JSON.stringify(['twitter']), tweet.created_at || ''] });
              totalCount++;
            } catch (e) {}
          }
        }
      if (batch.length > 0) {
      try {
        await db.batch(batch, 'write');
      } catch (e) { /* ignore batch errors */ }
    }
    } catch (err) {
      console.error(`[Twitter] Error for "${query}":`, err.message);
    }
  }

  console.log(`[Twitter] Ingested ${totalCount} new IoCs from Twitter`);
  return totalCount;
}
