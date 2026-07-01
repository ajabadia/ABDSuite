import mongoose from 'mongoose';

const uri = "mongodb+srv://ajabadia03_db_user:Ajabafan1974@cluster0.xarmew0.mongodb.net/ABDElevators-Auth?retryWrites=true&w=majority";

async function run() {
  console.log("Connecting to remote MongoDB Atlas cluster...");
  const connection = await mongoose.connect(uri);
  const client = connection.connection.client;

  const databases = ['ABDElevators-Auth', 'ABD-Auth', 'test'];
  const collections = ['applications', 'Applications'];

  const satelliteData = {
    name: 'ABD Landing',
    description: 'Official multipurpose landing and portal page.',
    clientId: 'landing',
    clientSecret: 'dev-landing-client-secret',
    slug: 'landing',
    redirectUris: [
      'http://localhost:5000/api/auth/federated/callback',
      'http://localhost:5000',
      'https://abd-landing.vercel.app/api/auth/federated/callback',
      'https://abd-landing.vercel.app',
      'https://abdia.es/api/auth/federated/callback',
      'https://abdia.es',
      'https://www.abdia.es/api/auth/federated/callback',
      'https://www.abdia.es',
    ],
    active: true,
    updatedAt: new Date(),
  };

  for (const dbName of databases) {
    const db = client.db(dbName);
    console.log(`\n--- Processing Database: ${dbName} ---`);

    for (const colName of collections) {
      const collection = db.collection(colName);
      
      try {
        const existing = await collection.findOne({ clientId: 'landing' });
        
        if (existing) {
          console.log(`  [Found in ${colName}] Updating redirect URIs and ensuring active...`);
          await collection.updateOne(
            { _id: existing._id },
            { $set: satelliteData }
          );
          console.log(`  ✅ Successfully updated in db: ${dbName}, collection: ${colName}`);
        } else {
          console.log(`  [Not found in ${colName}] Creating new satellite application document...`);
          await collection.insertOne({
            ...satelliteData,
            createdAt: new Date()
          });
          console.log(`  ✅ Successfully created in db: ${dbName}, collection: ${colName}`);
        }
      } catch (err) {
        console.error(`  ❌ Error processing db: ${dbName}, collection: ${colName}:`, err.message);
      }
    }
  }

  await mongoose.disconnect();
  console.log("\nDisconnected from remote Atlas cluster successfully!");
}

run().catch(console.error);
