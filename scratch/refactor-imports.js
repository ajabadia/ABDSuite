const fs = require('fs');
const path = require('path');

const APPS = ['ABDQuiz', 'ABDAnalytics', 'ABDLogs', 'ABDtenantGobernance'];
const BASE_DIR = path.resolve(__dirname, '..');

const FILES_TO_DELETE = [
  'src/lib/tenant-branding.ts',
  'src/lib/session.ts',
  'src/lib/database/tenant-model.ts',
  'src/lib/logs-client.ts',
  'src/lib/logs-client.test.ts',
  'src/lib/cloudinary.ts',
  'src/lib/crypto-chain.ts',
  'src/lib/session-types.ts',
  'src/lib/database/mongodb.ts'
];

// Replaces imports from local lib to @abd/satellite-sdk
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace tenant-model imports
  content = content.replace(
    /import\s+({[^}]+})\s+from\s+['"](?:@\/|\.\.\/|\.\/)*lib\/database\/tenant-model['"];?/g,
    "import $1 from '@abd/satellite-sdk';"
  );
  
  content = content.replace(
    /import\s+type\s+({[^}]+})\s+from\s+['"](?:@\/|\.\.\/|\.\/)*lib\/database\/tenant-model['"];?/g,
    "import type $1 from '@abd/satellite-sdk';"
  );

  // Replace session imports
  content = content.replace(
    /import\s+({[^}]+})\s+from\s+['"](?:@\/|\.\.\/|\.\/)*lib\/session['"];?/g,
    "import $1 from '@abd/satellite-sdk';"
  );
  content = content.replace(
    /import\s+type\s+({[^}]+})\s+from\s+['"](?:@\/|\.\.\/|\.\/)*lib\/session['"];?/g,
    "import type $1 from '@abd/satellite-sdk';"
  );

  // Replace cloudinary imports
  content = content.replace(
    /import\s+({[^}]+})\s+from\s+['"](?:@\/|\.\.\/|\.\/)*lib\/cloudinary['"];?/g,
    "import $1 from '@abd/satellite-sdk';"
  );

  // Replace crypto-chain imports
  content = content.replace(
    /import\s+({[^}]+})\s+from\s+['"](?:@\/|\.\.\/|\.\/)*lib\/crypto-chain['"];?/g,
    "import $1 from '@abd/satellite-sdk';"
  );

  // Replace session-types imports
  content = content.replace(
    /import\s+({[^}]+})\s+from\s+['"](?:@\/|\.\.\/|\.\/)*lib\/session-types['"];?/g,
    "import $1 from '@abd/satellite-sdk';"
  );
  content = content.replace(
    /import\s+type\s+({[^}]+})\s+from\s+['"](?:@\/|\.\.\/|\.\/)*lib\/session-types['"];?/g,
    "import type $1 from '@abd/satellite-sdk';"
  );

  // Replace mongodb imports
  content = content.replace(
    /import\s+connectDB\s+from\s+['"](?:@\/|\.\.\/|\.\/)*lib\/database\/mongodb['"];?/g,
    "import { connectDB } from '@abd/satellite-sdk';"
  );

  // Replace logs-client imports
  content = content.replace(
    /import\s+{\s*LogsClient\s*}\s+from\s+['"](?:@\/|\.\.\/|\.\/)*lib\/logs-client['"];?/g,
    "import { logger } from '@abd/satellite-sdk';"
  );
  content = content.replace(
    /LogsClient\.log\(/g,
    "logger.audit("
  );
  
  // Custom fix for audit-service in Gobernance
  content = content.replace(
    /console\.log\(`\[AUDIT_SAAS_LOG\] Sent \${params\.action} event to central service successfully.`\);/g,
    ""
  );

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated imports in: ${filePath}`);
  }
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      processFile(fullPath);
    }
  }
}

for (const app of APPS) {
  const appDir = path.join(BASE_DIR, app);
  
  // 1. Delete redundant files
  for (const file of FILES_TO_DELETE) {
    const filePath = path.join(appDir, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted: ${filePath}`);
    }
  }

  // 2. Process all TS/TSX files
  const srcDir = path.join(appDir, 'src');
  if (fs.existsSync(srcDir)) {
    walkDir(srcDir);
  }
}

console.log('Refactoring complete!');
