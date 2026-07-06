/**
 * Worker entry point — runs background jobs (e.g. document purging).
 * Intended for PM2 fork mode (abd-worker).
 *
 * Usage:
 *   node scripts/worker-entry.js
 */

process.env.NODE_ENV = process.env.NODE_ENV || 'production';

const POLL_INTERVAL_MS = 60_000;

async function start() {
  console.log('[WORKER] Starting background worker...');

  const run = async () => {
    try {
      const { DocumentService } = await import('../ABDFiles/.next/server/chunks/services/document-service.js');
      const now = new Date();
      await DocumentService.purgeExpiredDocuments(now);
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[WORKER] purgeExpiredDocuments completed at ${now.toISOString()}`);
      }
    } catch (err) {
      console.error('[WORKER] purge cycle error:', err);
    }
  };

  await run();
  setInterval(run, POLL_INTERVAL_MS);
}

module.exports = { start };

if (require.main === module) {
  start();
}
