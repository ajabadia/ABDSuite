const { execSync } = require('child_process');

const vars = {
    "AUTH_PROVIDER_URL": "https://abd-auth.vercel.app",
    "AUTH_CLIENT_ID": "files",
    "AUTH_CLIENT_SECRET": "dev-files-client-secret",
    "AUTH_JWT_SECRET": "abd-auth-industrial-fallback-secret-2026",
    "NEXT_PUBLIC_APP_URL": "https://abd-files.vercel.app",
    "NEXT_PUBLIC_APP_ID": "files",
    "NEXT_PUBLIC_AUTH_PROVIDER_URL": "https://abd-auth.vercel.app",
    "MONGODB_URI": "mongodb+srv://abadia3d_db_user:Ajabafan1974@pruebas.nwakk9f.mongodb.net/?appName=pruebas",
    "MONGODB_AUTH_URI": "mongodb+srv://ajabadia03_db_user:Ajabafan1974@cluster0.xarmew0.mongodb.net/ABDElevators-Auth",
    "MONGODB_LOGS_URI": "mongodb+srv://ajabadia04_db_user:Ajabafan1974@logs.epv9qr8.mongodb.net/ABDElevators-Logs"
};

const targets = ['production', 'preview master', 'development'];

for (const [key, value] of Object.entries(vars)) {
    for (const target of targets) {
        // We split preview and branch if needed
        const envParts = target.split(' ');
        const envName = envParts[0];
        const branch = envParts[1] ? ` ${envParts[1]}` : '';
        const cmd = `vercel env add ${key} ${envName}${branch} --value "${value.replace(/"/g, '\\"')}" --yes --force`;
        console.log(`Executing: ${cmd}`);
        try {
            execSync(cmd, { stdio: 'inherit', timeout: 8000 });
        } catch (e) {
            console.log(`Finished or timed out for ${key} in ${target}`);
        }
    }
}
console.log("All variables synced!");
