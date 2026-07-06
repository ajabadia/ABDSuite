/**
 * One-time migration script to encrypt existing plaintext `title` fields
 * in ABDFiles Document records across all tenant databases.
 *
 * The deterministic encryption plugin is already active on the schema;
 * this script handles pre-existing documents that were stored in plaintext.
 *
 * Run: node scripts/encrypt-existing-titles.mjs
 * Requires: MONGODB_URI + ENCRYPTION_SECRET in .env.local
 */

import { MongoClient } from 'mongodb';
import crypto from 'crypto';
import { loadEnvFile } from 'node:process';
import path from 'node:path';

try {
  loadEnvFile(path.resolve(process.cwd(), '.env.local'));
} catch {
  // silent — env may be set via other means
}

function getEncryptionKey() {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) throw new Error('ENCRYPTION_SECRET is not set in environment');
  return crypto.scryptSync(secret, 'salt', 32);
}

function encryptDeterministic(text) {
  if (!text) return '';
  const key = getEncryptionKey();
  const hmac = crypto.createHmac('sha256', key);
  const iv = hmac.update(text, 'utf8').digest().slice(0, 16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

async function migrate() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('[MIGRATE] MONGODB_URI is not set');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  await client.connect();
  console.log('[MIGRATE] Connected to MongoDB');

  const adminDb = client.db().admin();
  const { databases } = await adminDb.listDatabases();
  const tenantDbs = databases.filter(d => d.name.startsWith('abd_tenant_'));

  if (tenantDbs.length === 0) {
    console.log('[MIGRATE] No tenant databases found (abd_tenant_*)');
  }

  let totalMigrated = 0;
  let totalSkipped = 0;

  for (const { name: dbName } of tenantDbs) {
    const db = client.db(dbName);
    const collection = db.collection('documents');

    const totalDocs = await collection.countDocuments();
    const alreadyEncrypted = await collection.countDocuments({ title: /:/ });
    const toMigrate = totalDocs - alreadyEncrypted;

    if (toMigrate === 0) {
      console.log(`[${dbName}] All ${totalDocs} docs already encrypted — skipping`);
      totalSkipped += totalDocs;
      continue;
    }

    console.log(`[${dbName}] ${toMigrate}/${totalDocs} docs need migration`);

    const cursor = collection.find({}).batchSize(200);
    const batch = [];
    let dbCount = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      if (!doc.title || typeof doc.title !== 'string') continue;
      if (doc.title.includes(':')) continue; // already encrypted

      batch.push({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: { title: encryptDeterministic(doc.title) } }
        }
      });

      if (batch.length >= 200) {
        await collection.bulkWrite(batch);
        dbCount += batch.length;
        console.log(`  [${dbName}] ${dbCount}/${toMigrate} migrated`);
        batch.length = 0;
      }
    }

    if (batch.length > 0) {
      await collection.bulkWrite(batch);
      dbCount += batch.length;
    }

    totalMigrated += dbCount;
    console.log(`[${dbName}] Done — ${dbCount} titles encrypted`);
  }

  console.log(`\n[MIGRATE] Complete — ${totalMigrated} migrated, ${totalSkipped} already encrypted`);
  await client.close();
}

migrate().catch(err => {
  console.error('[MIGRATE] Fatal error:', err);
  process.exit(1);
});
