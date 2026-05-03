import cron from 'node-cron';
import { runAllFeeds } from './feeds/index.js';
import { getDB } from './db.js';

export function startCronJobs() {
  // Poll all enabled feeds every 2 minutes
  cron.schedule('*/2 * * * *', async () => {
    console.log('[CRON] Running scheduled feed ingestion...');
    try {
      await runAllFeeds();
      console.log('[CRON] Scheduled ingestion complete.');
    } catch (err) {
      console.error('[CRON] Feed ingestion error:', err.message);
    }
  });

  // IoC Lifecycle Decay - Run daily at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('[CRON] Running IoC Confidence Decay Engine...');
    const db = getDB();
    try {
      // If an IoC hasn't been seen in 7 days, reduce its confidence by 5
      const res = await db.execute(`
        UPDATE iocs 
        SET confidence_level = MAX(0, confidence_level - 5) 
        WHERE (date(last_seen) < date('now', '-7 days') OR (last_seen = '' AND date(created_at) < date('now', '-7 days')))
        AND confidence_level > 0
      `);
      console.log(`[CRON] Confidence Decay complete. Rows affected: ${res.rowsAffected}`);
    } catch (err) {
      console.error('[CRON] Confidence Decay error:', err.message);
    }
  });

  console.log('[CRON] Scheduled: Feed polling (2m), Decay Engine (Daily).');
}
