const fs = require('fs');
const path = require('path');

const APPS = ['ABDQuiz', 'ABDAnalytics', 'ABDLogs', 'ABDtenantGobernance'];
const BASE_DIR = path.resolve(__dirname, '..');

// 1. Delete the files
for (const app of APPS) {
  const sessionPath = path.join(BASE_DIR, app, 'src/lib/session.ts');
  const logsClientPath = path.join(BASE_DIR, app, 'src/lib/logs-client.ts');
  
  if (fs.existsSync(sessionPath)) {
    fs.unlinkSync(sessionPath);
    console.log(`Deleted: ${sessionPath}`);
  }
  if (fs.existsSync(logsClientPath)) {
    fs.unlinkSync(logsClientPath);
    console.log(`Deleted: ${logsClientPath}`);
  }
}

// 2. Fix the 4 files in ABDtenantGobernance
const filesToFix = [
  'ABDtenantGobernance/src/app/[locale]/admin/users/page.tsx',
  'ABDtenantGobernance/src/app/[locale]/admin/quiz-roles/page.tsx',
  'ABDtenantGobernance/src/app/[locale]/admin/permissions/page.tsx',
  'ABDtenantGobernance/src/app/[locale]/admin/permissions/delegations/page.tsx'
];

for (const file of filesToFix) {
  const filePath = path.join(BASE_DIR, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // The broken block:
    /*
        try {
          const { getIndustrialSession } = await import('@/lib/session');
          const session = await getIndustrialSession();
          if (session?.user?.tenantId) {
            setTenantId(session.user.tenantId);
          } else {
            setTenantId('academia-alfa');
          }
        } catch {
          setTenantId('academia-alfa');
        }
    */
    
    // We replace it safely with just setting the fallback since this was always catching on the client anyway
    const brokenRegex = /try\s*{\s*const\s*{\s*getIndustrialSession\s*}\s*=\s*await\s*import\(['"]@\/lib\/session['"]\);\s*const\s*session\s*=\s*await\s*getIndustrialSession\(\);\s*if\s*\(session\?\.user\?\.tenantId\)\s*{\s*setTenantId\(session\.user\.tenantId\);\s*}\s*else\s*{\s*setTenantId\(['"]academia-alfa['"]\);\s*}\s*}\s*catch\s*{\s*setTenantId\(['"]academia-alfa['"]\);\s*}/g;
    
    if (brokenRegex.test(content)) {
      content = content.replace(brokenRegex, "setTenantId('academia-alfa');");
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed Webpack crash in: ${filePath}`);
    } else {
      console.log(`Regex did not match in: ${filePath}. Trying alternative regex...`);
      // Simpler replace just in case
      content = content.replace(
        /const { getIndustrialSession } = await import\('@\/lib\/session'\);/,
        "// removed broken import"
      );
      content = content.replace(
        /const session = await getIndustrialSession\(\);/,
        "const session = null;"
      );
      fs.writeFileSync(filePath, content, 'utf8');
    }
  }
}

console.log('Done fixing webpack crashes!');
