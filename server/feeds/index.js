import { getDB } from '../db.js';
import { pollThreatFox } from './threatfox.js';
import { pollURLhaus } from './urlhaus.js';
import { pollFeodoTracker } from './feodotracker.js';
import { pollMalwareBazaar } from './malwarebazaar.js';
import { pollOpenPhish } from './openphish.js';
import { pollCisaKev } from './cisaKev.js';
import { pollMastodon } from './mastodon.js';
import { pollTwitter } from './twitter.js';
import { pollTelegram } from './telegram.js';
import { pollEmail } from './email.js';
import { pollTaxii } from './taxii.js';
import { pollPulseDive } from './pulsedive.js';
import { pollPhishTank } from './phishtank.js';
import { pollNews } from './news.js';
import { pollSSLBL } from './sslbl.js';
import { pollRansomware } from './ransomware.js';
import { enrichRecentIoCs } from '../enrichment.js';
import { processAlerts } from '../alerting.js';
import { broadcast } from '../index.js';

const feedMap = {
  'ThreatFox': pollThreatFox,
  'URLhaus': pollURLhaus,
  'Feodo Tracker': pollFeodoTracker,
  'MalwareBazaar': pollMalwareBazaar,
  'OpenPhish': pollOpenPhish,
  'CISA KEV': pollCisaKev,
  'Mastodon': pollMastodon,
  'Twitter': pollTwitter,
  'Telegram': pollTelegram,
  'Email': pollEmail,
  'AlienVault OTX': pollTaxii,
  'PulseDive': pollPulseDive,
  'PhishTank': pollPhishTank,
  'News': pollNews,
  'SSLBL': pollSSLBL,
  'Ransomware Live': pollRansomware,
};

export async function runAllFeeds() {
  const db = getDB();
  const feedsRes = await db.execute('SELECT * FROM feeds WHERE enabled = 1');
  const feeds = feedsRes.rows;
  const results = {};

  console.log(`[Feeds] Running ${feeds.length} enabled feeds...`);

  for (const feed of feeds) {
    const pollFn = feedMap[feed.name];
    if (pollFn) {
      try {
        const count = await pollFn();
        results[feed.name] = count;
      } catch (err) {
        console.error(`[Feeds] Error in ${feed.name}:`, err.message);
        results[feed.name] = 0;
      }
    }
  }

  // Also run feeds not in the DB (TAXII)
  if (!results['AlienVault OTX']) {
    try {
      results['AlienVault OTX'] = await pollTaxii();
    } catch (e) { results['AlienVault OTX'] = 0; }
  }

  // Run enrichment on recent unenriched IoCs
  try {
    results['enrichment'] = await enrichRecentIoCs(5);
  } catch (e) { results['enrichment'] = 0; }

  // Process alerts
  try {
    results['alerts'] = await processAlerts();
  } catch (e) { results['alerts'] = 0; }

  console.log('[Feeds] Results:', results);

  // Calculate total new IoCs across all feeds (excluding enrichment/alerts/news)
  const totalNew = Object.entries(results)
    .filter(([name]) => !['enrichment', 'alerts', 'News'].includes(name))
    .reduce((sum, [, count]) => sum + (typeof count === 'number' ? count : 0), 0);

  if (totalNew > 0) {
    console.log(`[Feeds] Broadcasting ${totalNew} new IoCs to clients`);
    broadcast('new_iocs', { count: totalNew });
  }

  return results;
}
