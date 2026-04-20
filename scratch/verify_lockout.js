
import Dexie from 'dexie';

// Re-define DB for scratch query
const db = new Dexie('ABDFN_CORE');
db.version(8).stores({
  operators: 'id, displayName, username, pinHash, unitIds, role, isActive, isMaster, failedPinAttempts, failedMfaAttempts',
  system_log: 'id, timestamp, action, status'
});

async function verify() {
  console.log('--- OPERATORS ---');
  const ops = await db.table('operators').toArray();
  ops.forEach(o => {
    console.log(`User: ${o.username}, Active: ${o.isActive}, FailedPIN: ${o.failedPinAttempts}`);
  });

  console.log('\n--- RECENT LOGS ---');
  const logs = await db.table('system_log').orderBy('timestamp').reverse().limit(10).toArray();
  logs.forEach(l => {
    console.log(`[${new Date(l.timestamp).toISOString()}] ${l.action} - ${l.status} - ${l.details}`);
  });
}

verify().catch(console.error);
