const fs = require('fs');
const path = require('path');

const APPS = ['ABDQuiz', 'ABDAnalytics', 'ABDLogs', 'ABDtenantGobernance'];
const BASE_DIR = path.resolve(__dirname, '..');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Fix scripts directory mongodb import
  content = content.replace(
    /import\s+connectDB\s+from\s+['"]\.\.\/src\/lib\/database\/mongodb['"];?/g,
    "import { connectDB } from '@abd/satellite-sdk';"
  );
  
  // Fix dynamic imports in tests
  content = content.replace(
    /await\s+import\(['"]@\/lib\/database\/mongodb['"]\)/g,
    "await import('@abd/satellite-sdk')"
  );

  // Fix import * as SessionMod
  content = content.replace(
    /import\s+\*\s+as\s+SessionMod\s+from\s+['"]@\/lib\/session['"];?/g,
    "import * as SessionMod from '@abd/satellite-sdk';"
  );

  // Fix LogsClient missing usages
  content = content.replace(/LogsClient\./g, 'logger.');
  
  // If we changed LogsClient to logger, make sure logger is imported
  if (content.includes('logger.') && !content.includes('import { logger }') && !content.includes("import { logger,")) {
    content = "import { logger } from '@abd/satellite-sdk';\n" + content;
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed edge cases in: ${filePath}`);
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
  
  // Process src directory
  const srcDir = path.join(appDir, 'src');
  if (fs.existsSync(srcDir)) walkDir(srcDir);
  
  // Process scripts directory
  const scriptsDir = path.join(appDir, 'scripts');
  if (fs.existsSync(scriptsDir)) walkDir(scriptsDir);
}
