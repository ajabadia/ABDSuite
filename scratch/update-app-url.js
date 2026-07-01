const { execSync } = require('child_process');

const targets = [
  'production',
  'preview master',
  'development'
];

for (const target of targets) {
  const envParts = target.split(' ');
  const envName = envParts[0];
  const branch = envParts[1] ? ` ${envParts[1]}` : '';
  const cmd = `vercel env add NEXT_PUBLIC_APP_URL ${envName}${branch} --value "https://files.abdia.es" --yes --force`;
  console.log(`Executing: ${cmd}`);
  try {
    execSync(cmd, { stdio: 'inherit', timeout: 8000 });
  } catch (e) {
    console.log(`Finished or timed out for NEXT_PUBLIC_APP_URL in ${target}`);
  }
}
console.log("NEXT_PUBLIC_APP_URL updated to https://files.abdia.es!");
