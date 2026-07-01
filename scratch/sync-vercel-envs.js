const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const apps = [
  { dir: 'ABDAnalytics', domain: 'abd-analytics.vercel.app' },
  { dir: 'ABDLogs', domain: 'abd-logs.vercel.app' },
  { dir: 'ABDQuiz', domain: 'abd-quiz.vercel.app' },
  { dir: 'ABDtenantGobernance', domain: 'abd-tenant-gobernance.vercel.app' },
  { dir: 'ABDAuth', domain: 'abd-auth.vercel.app' },
  { dir: 'ABDFiles', domain: 'abd-files.vercel.app' }
];

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
if (!GITHUB_TOKEN) {
  console.error('ERROR: GITHUB_TOKEN environment variable is required. Set it before running this script.');
  process.exit(1);
}

for (const app of apps) {
  console.log(`\n================================`);
  console.log(`Processing ${app.dir}...`);
  console.log(`================================\n`);
  
  const appPath = path.resolve(__dirname, '..', app.dir);
  
  // 1. Link to Vercel (if not already linked)
  try {
      execSync('vercel link --yes', { cwd: appPath, stdio: 'inherit' });
  } catch (e) {
      console.warn(`Warning: vercel link might have failed, or it's already linked.`);
  }
  
  // 2. Read .env.local
  const envPath = path.join(appPath, '.env.local');
  if (!fs.existsSync(envPath)) {
      console.log(`No .env.local in ${app.dir}, skipping env parsing...`);
      continue;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  const vars = {};
  
  for (let line of lines) {
     line = line.trim();
     if (!line || line.startsWith('#')) continue;
     const eqIdx = line.indexOf('=');
     if (eqIdx === -1) continue;
     const key = line.substring(0, eqIdx).trim();
     let val = line.substring(eqIdx + 1).trim();
     
     // Remove wrapping quotes if present
     if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
         val = val.substring(1, val.length - 1);
     }
     vars[key] = val;
  }
  
  // 3. Inject Missing / Required Variables
  vars['GITHUB_NPM_TOKEN'] = GITHUB_TOKEN;
  
  // Replace localhost URLs with production URLs for cross-communication
  if (vars['NEXTAUTH_URL']) vars['NEXTAUTH_URL'] = `https://${app.domain}`;
  if (vars['AUTH_URL']) vars['AUTH_URL'] = `https://${app.domain}`;
  if (vars['APP_DOMAIN']) vars['APP_DOMAIN'] = app.domain;
  if (vars['NEXT_PUBLIC_APP_URL']) vars['NEXT_PUBLIC_APP_URL'] = `https://${app.domain}`;
  
  // Point all apps to the central identity provider (ABDAuth)
  if (vars['AUTH_PROVIDER_URL']) vars['AUTH_PROVIDER_URL'] = `https://auth.abdia.es`;
  if (vars['AUTH_VERIFY_URL']) vars['AUTH_VERIFY_URL'] = `https://auth.abdia.es/api/auth/federated/token`;
  
  // 4. Upload to Vercel
  const targets = ['production', 'preview', 'development'];
  
  for (const [key, value] of Object.entries(vars)) {
      if (!value) continue;
      
      console.log(`Adding ${key}...`);
      try {
          // Escaping double quotes in value if any
          const safeVal = value.replace(/"/g, '\\"');
          
          for (const target of targets) {
             execSync(`vercel env add ${key} ${target} --value "${safeVal}" --yes --force`, { cwd: appPath });
          }
      } catch (e) {
          console.error(`Failed to add ${key}: ${e.message}`);
      }
  }
  
  console.log(`Finished processing ${app.dir}.`);
}
