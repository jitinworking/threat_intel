import fetch from 'node-fetch';
import { getDB } from './db.js';

// Alerting Engine — always persists alerts to the DB for the SOC dashboard.
// Optionally notifies via Discord/Slack webhooks if configured.
export async function processAlerts() {
  const db = getDB();

  const discordRow = db.prepare("SELECT value FROM settings WHERE key = 'discord_webhook_url'").get();
  const slackRow = db.prepare("SELECT value FROM settings WHERE key = 'slack_webhook_url'").get();
  const keywordsRow = db.prepare("SELECT value FROM settings WHERE key = 'alert_keywords'").get();

  const discordUrl = discordRow?.value;
  const slackUrl = slackRow?.value;
  const keywords = keywordsRow?.value ? keywordsRow.value.split(',').map(k => k.trim().toLowerCase()) : [];

  // Find recent IoCs that haven't been alerted yet (last 5 minutes)
  const unsent = db.prepare(`
    SELECT i.* FROM iocs i
    LEFT JOIN alerts a ON a.ioc_id = i.id
    WHERE a.id IS NULL AND i.created_at > datetime('now', '-5 minutes')
    ORDER BY i.created_at DESC LIMIT 20
  `).all();

  let alertCount = 0;

  for (const ioc of unsent) {
    // If keywords are configured, filter by them. Otherwise alert on everything.
    const matchesKeyword = keywords.length === 0 || keywords.some(kw =>
      ioc.ioc.toLowerCase().includes(kw) ||
      ioc.malware.toLowerCase().includes(kw) ||
      (ioc.tags || '').toLowerCase().includes(kw)
    );

    if (!matchesKeyword) continue;

    const severity = ioc.confidence_level >= 90 ? 'critical' :
                     ioc.confidence_level >= 70 ? 'high' :
                     ioc.confidence_level >= 50 ? 'medium' : 'low';

    const message = `🚨 [${severity.toUpperCase()}] New ${ioc.ioc_type} indicator: ${ioc.ioc} — ${ioc.malware_printable || 'Unknown malware'} (Source: ${ioc.source}, Confidence: ${ioc.confidence_level}%)`;

    // Always record the alert in the DB for the SOC dashboard
    try {
      db.prepare('INSERT OR IGNORE INTO alerts (ioc_id, message, severity, sent) VALUES (?, ?, ?, 0)')
        .run(ioc.id, message, severity);
      alertCount++;
    } catch (e) {
      console.error('[Alerting] Failed to insert alert:', e.message);
    }

    // Optionally send to Discord if configured
    if (discordUrl) {
      const discordMsg = `**New Threat Intel Alert** [${severity.toUpperCase()}]\n` +
        `**Indicator:** \`${ioc.ioc}\`\n` +
        `**Type:** ${ioc.ioc_type}\n` +
        `**Source:** ${ioc.source}\n` +
        `**Malware:** ${ioc.malware_printable || 'Unknown'}\n` +
        `**Confidence:** ${ioc.confidence_level}%`;
      try {
        await fetch(discordUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: discordMsg }),
        });
      } catch (e) { console.error('[Alert/Discord]', e.message); }
    }

    // Optionally send to Slack if configured
    if (slackUrl) {
      const slackMsg = `[${severity.toUpperCase()}] ${ioc.ioc} (${ioc.ioc_type}) — ${ioc.malware_printable || 'Unknown'} via ${ioc.source}`;
      try {
        await fetch(slackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: slackMsg }),
        });
      } catch (e) { console.error('[Alert/Slack]', e.message); }
    }
  }

  if (alertCount > 0) {
    console.log(`[Alerting] Saved ${alertCount} new alerts to database`);
  }
  return alertCount;
}

