import fetch from 'node-fetch';
import { getDB } from './db.js';

// Alerting Engine — sends notifications via Discord/Slack webhooks
export async function processAlerts() {
  const db = getDB();

  try {
    const discordRow = await db.execute("SELECT value FROM settings WHERE key = 'discord_webhook_url'");
    const slackRow = await db.execute("SELECT value FROM settings WHERE key = 'slack_webhook_url'");
    const keywordsRow = await db.execute("SELECT value FROM settings WHERE key = 'alert_keywords'");

    const discordUrl = discordRow.rows[0]?.value;
    const slackUrl = slackRow.rows[0]?.value;
    const keywordsStr = keywordsRow.rows[0]?.value;
    const keywords = keywordsStr ? keywordsStr.split(',').map(k => k.trim().toLowerCase()) : [];

    if (!discordUrl && !slackUrl) {
      return 0;
    }

    // Find recent IoCs matching keywords that haven't been alerted
    const unsentRes = await db.execute(`
      SELECT i.* FROM iocs i
      LEFT JOIN alerts a ON a.ioc_id = i.id
      WHERE a.id IS NULL AND i.created_at > datetime('now', '-5 minutes')
      ORDER BY i.created_at DESC LIMIT 20
    `);
    const unsent = unsentRes.rows;

    let alertCount = 0;

    for (const ioc of unsent) {
      const matchesKeyword = keywords.length === 0 || keywords.some(kw =>
        ioc.ioc.toLowerCase().includes(kw) ||
        (ioc.malware || '').toLowerCase().includes(kw) ||
        (ioc.tags || '').toLowerCase().includes(kw)
      );

      if (!matchesKeyword) continue;

      const severity = ioc.confidence_level >= 90 ? 'critical' :
                       ioc.confidence_level >= 70 ? 'high' :
                       ioc.confidence_level >= 50 ? 'medium' : 'low';

      const message = `🚨 **New Threat Intel Alert** [${severity.toUpperCase()}]\n` +
        `**Indicator:** \`${ioc.ioc}\`\n` +
        `**Type:** ${ioc.ioc_type}\n` +
        `**Source:** ${ioc.source}\n` +
        `**Malware:** ${ioc.malware_printable || 'Unknown'}\n` +
        `**Confidence:** ${ioc.confidence_level}%`;

      // Send to Discord
      if (discordUrl) {
        try {
          await fetch(discordUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: message }),
          });
        } catch (e) { console.error('[Alert/Discord]', e.message); }
      }

      // Send to Slack
      if (slackUrl) {
        try {
          await fetch(slackUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: message }),
          });
        } catch (e) { console.error('[Alert/Slack]', e.message); }
      }

      // Record alert
      await db.execute({
        sql: 'INSERT INTO alerts (ioc_id, message, severity, sent) VALUES (?, ?, ?, 1)',
        args: [ioc.id, message, severity]
      });
      alertCount++;
    }

    if (alertCount > 0) {
      console.log(`[Alerting] Sent ${alertCount} alerts`);
    }
    return alertCount;
  } catch (err) {
    console.error('[Alerting] Error:', err.message);
    return 0;
  }
}
