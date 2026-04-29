import fetch from 'node-fetch';
import { getDB } from '../db.js';

// Mastodon's public API is free and requires no authentication
export async function pollMastodon() {
  const db = getDB();
  const instances = ['https://infosec.exchange', 'https://ioc.exchange'];
  const hashtags = ['ioc', 'malware', 'threatintel', 'cybersecurity', 'apt'];

  let totalCount = 0;

  for (const instance of instances) {
    for (const tag of hashtags) {
      try {
        const res = await fetch(`${instance}/api/v1/timelines/tag/${tag}?limit=20`);
        if (!res.ok) continue;
        const posts = await res.json();

        if (!Array.isArray(posts)) continue;

        const insertSql = `
          INSERT OR IGNORE INTO iocs (ioc, ioc_type, threat_type, threat_type_desc, malware, malware_printable, confidence_level, source, tags, first_seen)
          VALUES (?, ?, 'social_intel', 'Social Media Indicator', ?, ?, 60, 'Mastodon', ?, ?)
        `;

        const batch = [];
    // begin batch
          for (const post of posts) {
            const text = (post.content || '').replace(/<[^>]+>/g, '');

            // Extract hashes
            const sha256s = text.match(/\b[A-Fa-f0-9]{64}\b/g) || [];
            const md5s = text.match(/\b[A-Fa-f0-9]{32}\b/g) || [];
            // Extract defanged IPs
            const ips = text.match(/\b(?:\d{1,3}(?:\[\.\]|\.)){3}\d{1,3}\b/g) || [];
            // Extract defanged domains
            const domains = text.match(/[a-zA-Z0-9-]+\[\.\][a-zA-Z]{2,}/g) || [];

            const all = [
              ...sha256s.map(h => ({ ioc: h, type: 'sha256' })),
              ...md5s.map(h => ({ ioc: h, type: 'md5' })),
              ...ips.map(ip => ({ ioc: ip.replace(/\[\.\]/g, '.'), type: 'ipv4' })),
              ...domains.map(d => ({ ioc: d.replace(/\[\.\]/g, '.'), type: 'domain' })),
            ];

            for (const item of all) {
              try {
                batch.push({ sql: insertSql, args: [
                  item.ioc, item.type,
                  tag, tag,
                  JSON.stringify([tag, 'mastodon']),
                  post.created_at || ''
                ] });
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
        // Silently skip failing instances
      }
    }
  }

  await db.execute("UPDATE feeds SET last_polled = datetime('now') WHERE name = 'Mastodon'");
  console.log(`[Mastodon] Ingested ${totalCount} new IoCs from social feeds`);
  return totalCount;
}
