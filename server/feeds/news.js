import fetch from 'node-fetch';
import { getDB } from '../db.js';

const NEWS_FEEDS = [
  { name: 'BleepingComputer', url: 'https://www.bleepingcomputer.com/feed/', category: 'General' },
  { name: 'The Hacker News', url: 'https://feeds.feedburner.com/TheHackersNews', category: 'APT/Vulnerability' },
  { name: 'Krebs on Security', url: 'https://krebsonsecurity.com/feed/', category: 'Cybercrime' }
];

export async function pollNews() {
  const db = getDB();
  let totalNew = 0;

  for (const feed of NEWS_FEEDS) {
    try {
      const response = await fetch(feed.url);
      const text = await response.text();
      
      // Basic RSS parser using regex
      const items = text.split('<item>');
      items.shift(); // Remove the prologue before the first <item>

      const upsert = db.prepare(`
        INSERT OR IGNORE INTO news (title, source, summary, url, category, published_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const item of items) {
        const title = (item.match(/<title>(.*?)<\/title>/s)?.[1] || '').replace(/<!\[CDATA\[(.*?)\]\]>/s, '$1').trim();
        const link = (item.match(/<link>(.*?)<\/link>/s)?.[1] || '').replace(/<!\[CDATA\[(.*?)\]\]>/s, '$1').trim();
        const description = (item.match(/<description>(.*?)<\/description>/s)?.[1] || '').replace(/<!\[CDATA\[(.*?)\]\]>/s, '$1').trim()
          .replace(/<[^>]*>/g, '').substring(0, 300) + '...';
        const pubDate = (item.match(/<pubDate>(.*?)<\/pubDate>/s)?.[1] || '').trim();
        
        if (title && link) {
          const result = upsert.run(title, feed.name, description, link, feed.category, pubDate);
          totalNew += result.changes;
        }
      }
    } catch (err) {
      console.error(`[News] Error polling ${feed.name}:`, err.message);
    }
  }

  console.log(`[News] Ingested ${totalNew} new articles.`);
  return totalNew;
}
