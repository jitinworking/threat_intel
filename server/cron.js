import cron from 'node-cron';
import { runAllFeeds } from './feeds/index.js';

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

  console.log('[CRON] Scheduled: Feed polling every 2 minutes.');
}
