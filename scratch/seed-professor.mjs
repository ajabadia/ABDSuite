/**
 * 🎓 Seed PROFESSOR User Script
 * 
 * Creates:
 * 1. A user in ABDAuth (better-auth users collection) with role PROFESSOR
 * 2. A QuizUserRole entry in the ABDQuiz tenant database with roleType PROFESSOR
 * 
 * Usage: node scratch/seed-professor.mjs
 */

import { MongoClient } from 'mongodb';
import crypto from 'crypto';

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://ajabadia03_db_user:Ajabafan1974@cluster0.xarmew0.mongodb.net/";
const AUTH_DB = "ABDElevators-Auth";
const QUIZ_TENANT_DB = "abd_tenant_abdelevators"; // Tenant for ABDElevators

async function hashPassword(password) {
  // Use the Web Crypto API compatible with Node 20+
  const { createHash, randomBytes } = await import('crypto');
  const salt = randomBytes(16).toString('hex');
  // Argon2 would be ideal but simpler to use a hash that better-auth recognizes
  // For seed scripts, we create a user with a known password that better-auth can verify
  return password; // Will use better-auth's own hashing
}

async function run() {
  console.log('🔌 Connecting to MongoDB...');
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected successfully');

    const authDb = client.db(AUTH_DB);
    
    // 1️⃣ Check existing users
    const usersCol = authDb.collection('users');
    const existingProfessor = await usersCol.findOne({ email: 'profesor@test.com' });
    
    if (existingProfessor) {
      console.log('👤 Professor user already exists:', existingProfessor._id);
      console.log('   Role:', existingProfessor.role);
      console.log('   TenantId:', existingProfessor.tenantId);
      console.log('   Skipping creation...');
      
      // Still check QuizUserRole
      const quizDb = client.db(QUIZ_TENANT_DB);
      const existingRole = await quizDb.collection('abdelevators_quizuserroles').findOne({
        userId: existingProfessor._id.toString(),
        tenantId: existingProfessor.tenantId
      });
      
      if (existingRole) {
        console.log('✅ QuizUserRole already exists:', existingRole);
        return { userId: existingProfessor._id.toString(), tenantId: existingProfessor.tenantId };
      }
    }

    // 2️⃣ Find an existing tenant to use (or use the user's tenant)
    // Look for a tenant in the auth DB
    const tenantsCol = authDb.collection('tenants');
    const tenant = await tenantsCol.findOne({});
    
    if (!tenant) {
      console.error('❌ No tenants found. Create a tenant first via the admin UI.');
      return;
    }
    
    console.log('🏢 Using tenant:', tenant.name, '(' + tenant.tenantId + ')');
    console.log('   DB Prefix:', tenant.dbPrefix);

    let userId;
    let tenantId = tenant.tenantId;
    let dbPrefix = tenant.dbPrefix;

    if (!existingProfessor) {
      // 3️⃣ Create the professor user
      const professorUser = {
        email: 'profesor@test.com',
        name: 'Carlos',
        surname: 'Profesor Test',
        role: 'PROFESSOR',
        tenantId: tenantId,
        tenantIds: [tenantId],
        tenants: [{
          tenantId: tenantId,
          role: 'admin',
          status: 'active',
          allowedApps: ['abd-quiz'],
          groupIds: []
        }],
        dbPrefix: dbPrefix,
        isolationStrategy: tenant.isolationStrategy || 'COLLECTION_PREFIX',
        active: true,
        emailVerified: new Date(),
        mfaEnabled: false,
        mfaEnforced: false,
        mfa_verified: false,
        loginAttempts: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await usersCol.insertOne(professorUser);
      userId = result.insertedId.toString();
      console.log('✅ Created professor user:', userId);
      console.log('   Email: profesor@test.com');
      console.log('   Password: 11111111 (will need to be set via better-auth)');
      console.log('   Role: PROFESSOR');

      // 4️⃣ Create a session for immediate access (using better-auth's session format)
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const sessionsCol = authDb.collection('sessions');
      await sessionsCol.insertOne({
        userId: userId,
        token: sessionToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        createdAt: new Date(),
        updatedAt: new Date(),
        ipAddress: '127.0.0.1',
        userAgent: 'Seed Script'
      });
      console.log('✅ Created session token');

    } else {
      userId = existingProfessor._id.toString();
      tenantId = existingProfessor.tenantId;
      dbPrefix = existingProfessor.dbPrefix || 'abdelevators';
    }

    // 5️⃣ Create QuizUserRole entry
    // The QuizUserRole is stored in the tenant-specific database with collection prefix
    const quizDb = client.db(QUIZ_TENANT_DB);
    const collectionName = `${dbPrefix}_quizuserroles`;
    const quizUserRolesCol = quizDb.collection(collectionName);

    // Create a scope for testing (using a test space ID or course ID)
    const scopeId = 'test-scope-professor-001';
    
    // Check if exists first
    const existingRole = await quizUserRolesCol.findOne({
      userId: userId,
      tenantId: tenantId,
      scopeId: scopeId
    });

    if (!existingRole) {
      await quizUserRolesCol.insertOne({
        tenantId: tenantId,
        userId: userId,
        scopeType: 'course',
        scopeId: scopeId,
        roleType: 'PROFESSOR',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ Created QuizUserRole: PROFESSOR in scope', scopeId);
    } else {
      console.log('✅ QuizUserRole already exists:', existingRole);
    }

    console.log('\n🎓 === SEED COMPLETE ===');
    console.log('   Email:    profesor@test.com');
    console.log('   Password: 11111111');
    console.log('   Role:     PROFESSOR (system)');
    console.log('   Scope:    PROFESSOR (QuizUserRole)');
    console.log('   Tenant:   ' + tenantId);
    console.log('');
    console.log('⚠️  NOTE: The password needs to be set via better-auth reset-password flow.');
    console.log('   OR update it directly in the users collection with a bcrypt/argon2 hash.');
    console.log('   Use the ABDAuth "Forgot Password" flow with: profesor@test.com');
    
    return { userId, tenantId };

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
    console.log('🔌 Connection closed');
  }
}

run().catch(console.error);
