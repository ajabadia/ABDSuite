const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const app = { dir: 'ABDLanding', domain: 'abd-landing.vercel.app' };
const appPath = path.resolve(__dirname, '..', app.dir);

console.log(`Processing ${app.dir}...`);

// Read .env.local
const envPath = path.join(appPath, '.env.local');
if (!fs.existsSync(envPath)) {
    console.error(`Error: No .env.local in ${app.dir}`);
    process.exit(1);
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

// Replace localhost URLs with production URLs for cross-communication
if (vars['NEXT_PUBLIC_APP_URL']) vars['NEXT_PUBLIC_APP_URL'] = `https://${app.domain}`;
if (vars['AUTH_PROVIDER_URL']) vars['AUTH_PROVIDER_URL'] = `https://abd-auth.vercel.app`;

console.log('Variables parsed:', Object.keys(vars));

const targets = ['production', 'preview', 'development'];

for (const [key, value] of Object.entries(vars)) {
    if (!value) continue;
    // We don't want to overwrite MONGODB_URI if it's already there, but we can set it anyway since it's the correct one.
    console.log(`Setting ${key}...`);
    try {
        const safeVal = value.replace(/"/g, '\\"');
        for (const target of targets) {
           console.log(`  -> ${target}`);
           execSync(`vercel env add ${key} ${target} --value "${safeVal}" --yes --force`, { cwd: appPath });
        }
    } catch (e) {
        console.error(`Failed to add ${key}: ${e.message}`);
    }
}

console.log(`Finished processing ${app.dir}.`);
