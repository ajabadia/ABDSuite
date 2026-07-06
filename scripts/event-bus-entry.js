/**
 * Event Bus entry point — starts all event bus consumers (connector + quota).
 * Intended for PM2 cluster mode (abd-event-bus).
 *
 * This script loads the compiled Next.js server code from ABDFiles and
 * ABDtenantGovernance to attach the event listeners. It polls for pending
 * events every 30 seconds.
 *
 * Usage:
 *   node scripts/event-bus-entry.js
 */

process.env.NODE_ENV = process.env.NODE_ENV || 'production';

async function start() {
  try {
    const { processConnectorEvents } = await import('../ABDFiles/.next/server/chunks/services/connector-listener.js');
    const { processQuotaEvents } = await import('../ABDtenantGovernance/.next/server/chunks/services/quota-listener.js');

    console.log('[EVENT_BUS] Listeners attached. Polling every 30s...');

    setInterval(async () => {
      try {
        await Promise.all([
          processConnectorEvents().catch(e => console.error('[EVENT_BUS] connector error:', e)),
          processQuotaEvents().catch(e => console.error('[EVENT_BUS] quota error:', e)),
        ]);
      } catch (err) {
        console.error('[EVENT_BUS] poll cycle error:', err);
      }
    }, 30000);
  } catch (err) {
    console.error('[EVENT_BUS] Failed to load listeners — ensure Next.js projects are built:', err);
    process.exit(1);
  }
}

module.exports = { start };

if (require.main === module) {
  start();
}
