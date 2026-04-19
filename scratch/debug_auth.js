const Dexie = require('dexie');
const { ABDFNCoreDB } = require('./src/lib/db/SystemDB'); // This might not work in node easily if it has TS/Next imports

// I'll just use a raw Dexie script to inspect ABDFN_CORE
async function debugCore() {
    const db = new Dexie('ABDFN_CORE');
    db.version(1).stores({
        units: 'id, code, name, isActive',
        operators: 'id, name, pinHash, unitIds, role, isActive',
        system_log: 'id, timestamp, action, status'
    });
    
    await db.open();
    const ops = await db.table('operators').toArray();
    console.log('--- OPERATORS IN CORE ---');
    console.log(JSON.stringify(ops, null, 2));
    
    const logs = await db.table('system_log').orderBy('timestamp').reverse().limit(5).toArray();
    console.log('--- RECENT SYSTEM LOGS ---');
    console.log(JSON.stringify(logs, null, 2));
}

// debugCore();
