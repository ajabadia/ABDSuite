const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve('d:/desarrollos/ABDSuite/ABDtenantGobernance/.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) return;
    const [key, ...valueParts] = trimmedLine.split('=');
    const value = valueParts.join('=');
    if (key && value) {
      process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
    }
  });
}

async function check() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not found');
    return;
  }

  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');
    
    // In multi-tenant with collection prefix, let's list collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n--- COLLECTIONS ---');
    collections.forEach(c => console.log(`- ${c.name}`));

    // Let's find tenants
    const Tenant = mongoose.models.Tenant || mongoose.model('Tenant', new mongoose.Schema({}, { strict: false }));
    const tenants = await Tenant.find({}).lean();
    console.log('\n--- TENANTS ---');
    console.log(JSON.stringify(tenants, null, 2));

    // Let's query spaces in the default collection or prefixed collections
    console.log('\n--- SPACES & GROUPS FOR ALL PREFIXES ---');
    for (const c of collections) {
      if (c.name.endsWith('_spaces') || c.name.endsWith('_permissiongroups')) {
        const coll = mongoose.connection.db.collection(c.name);
        const docs = await coll.find({}).toArray();
        if (docs.length > 0) {
          console.log(`\nCollection: ${c.name} (${docs.length} docs)`);
          docs.forEach(d => {
            console.log(`  - ID: ${d._id} | Name: ${d.name} | TenantId: ${d.tenantId} | Parent: ${d.parentSpaceId || d.parentId}`);
          });
        }
      }
    }

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.connection.close();
  }
}

check();
