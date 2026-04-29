import fetch from 'node-fetch';
import { getDB } from '../db.js';

// Telegram Bot API — requires bot token and channel IDs configured in settings
export async function pollTelegram() {
  const db = getDB();
  const tokenRow = db.prepare("SELECT value FROM settings WHERE key = 'telegram_bot_token'").get();
  const channelsRow = db.prepare("SELECT value FROM settings WHERE key = 'telegram_channels'").get();

  const token = tokenRow?.value;
  if (!token) {
    console.log('[Telegram] No bot token configured. Skipping.');
    return 0;
  }

  const channels = channelsRow?.value ? channelsRow.value.split(',').map(c => c.trim()) : [];
  if (channels.length === 0) {
    console.log('[Telegram] No channels configured. Skipping.');
    return 0;
  }

  let totalCount = 0;

  for (const channel of channels) {
    try {
      // Use getUpdates to read channel messages (bot must be added to the channel)
      const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=-50&limit=50`);
      const json = await res.json();

      if (!json.ok || !json.result) continue;

      const insertSql = `
        INSERT OR IGNORE INTO iocs (ioc, ioc_type, threat_type, threat_type_desc, malware, malware_printable, confidence_level, source, tags, first_seen)
        VALUES (?, ?, 'social_intel', 'Telegram Intel', ?, ?, 60, 'Telegram', ?, ?)
      `;

      const batch = [];
    // begin batch
        for (const update of json.result) {
          const text = update.message?.text || update.channel_post?.text || '';
          if (!text) continue;

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
              batch.push({ sql: insertSql, args: [item.ioc, item.type, 'telegram', 'telegram', JSON.stringify(['telegram', channel]), ''] });
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
      console.error(`[Telegram] Error for channel ${channel}:`, err.message);
    }
  }

  console.log(`[Telegram] Ingested ${totalCount} new IoCs from Telegram`);
  return totalCount;
}
