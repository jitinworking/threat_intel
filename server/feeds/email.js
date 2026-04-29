import { getDB } from '../db.js';

// Email IMAP ingestion — checks for IMAP credentials in settings
// NOTE: Requires the 'imapflow' package. Install with: npm install imapflow
export async function pollEmail() {
  const db = getDB();
  const hostRow = db.prepare("SELECT value FROM settings WHERE key = 'imap_host'").get();
  const userRow = db.prepare("SELECT value FROM settings WHERE key = 'imap_user'").get();
  const passRow = db.prepare("SELECT value FROM settings WHERE key = 'imap_password'").get();

  const host = hostRow?.value;
  const user = userRow?.value;
  const pass = passRow?.value;

  if (!host || !user || !pass) {
    console.log('[Email] No IMAP credentials configured. Skipping.');
    return 0;
  }

  let totalCount = 0;

  try {
    // Dynamic import — only loads if imapflow is installed
    const { ImapFlow } = await import('imapflow');

    const client = new ImapFlow({
      host, port: 993,
      secure: true,
      auth: { user, pass },
      logger: false,
    });

    await client.connect();
    const lock = await client.getMailboxLock('INBOX');

    try {
      // Fetch last 20 unseen messages
      for await (const message of client.fetch({ seen: false }, { source: true })) {
        const text = message.source?.toString() || '';

        const sha256s = text.match(/\b[A-Fa-f0-9]{64}\b/g) || [];
        const ips = text.match(/\b(?:\d{1,3}(?:\[\.\]|\.)){3}\d{1,3}\b/g) || [];
        const domains = text.match(/[a-zA-Z0-9-]+\[\.\][a-zA-Z]{2,}/g) || [];

        const insertSql = `
          INSERT OR IGNORE INTO iocs (ioc, ioc_type, threat_type, threat_type_desc, malware, malware_printable, confidence_level, source, tags)
          VALUES (?, ?, 'email_intel', 'Email Ingested', 'email', 'Email Feed', 65, 'Email', '["email"]')
        `;

        const all = [
          ...sha256s.map(h => ({ ioc: h, type: 'sha256' })),
          ...ips.map(ip => ({ ioc: ip.replace(/\[\.\]/g, '.'), type: 'ipv4' })),
          ...domains.map(d => ({ ioc: d.replace(/\[\.\]/g, '.'), type: 'domain' })),
        ];

        const batch = [];
    // begin batch
          for (const item of all) {
            try {
              batch.push({ sql: insertSql, args: [item.ioc, item.type] });
              totalCount++;
            } catch (e) {}
          }
        if (batch.length > 0) {
      try {
        await db.batch(batch, 'write');
      } catch (e) { /* ignore batch errors */ }
    }
      }
    } finally {
      lock.release();
    }

    await client.logout();
  } catch (err) {
    console.error('[Email] Error:', err.message);
  }

  console.log(`[Email] Ingested ${totalCount} new IoCs from email`);
  return totalCount;
}
