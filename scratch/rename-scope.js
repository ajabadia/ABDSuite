import fs from 'fs';
import path from 'path';

// 1. Rename inside ABDi18n/package.json
const abdi18nPkgPath = path.resolve('ABDi18n', 'package.json');
if (fs.existsSync(abdi18nPkgPath)) {
  let content = fs.readFileSync(abdi18nPkgPath, 'utf8');
  content = content.replace(/"name":\s*"@abd\/i18n"/, '"name": "@ajabadia/i18n"');
  fs.writeFileSync(abdi18nPkgPath, content, 'utf8');
  console.log('Updated package name in ABDi18n/package.json');
}

// List of satellites
const satellites = [
  'ABDLanding',
  'ABDAnalytics',
  'ABDLogs',
  'ABDQuiz',
  'ABDAuth',
  'ABDtenantGobernance',
  'ABDFiles'
];

for (const satellite of satellites) {
  // 2. Update package.json
  const pkgPath = path.resolve(satellite, 'package.json');
  if (fs.existsSync(pkgPath)) {
    let content = fs.readFileSync(pkgPath, 'utf8');
    content = content.replace(/"@abd\/i18n"/g, '"@ajabadia/i18n"');
    fs.writeFileSync(pkgPath, content, 'utf8');
    console.log(`Updated package.json for ${satellite}`);
  }

  // 3. Update src/i18n/request.ts
  const requestPath = path.resolve(satellite, 'src', 'i18n', 'request.ts');
  if (fs.existsSync(requestPath)) {
    let content = fs.readFileSync(requestPath, 'utf8');
    content = content.replace(/['"]@abd\/i18n['"]/g, "'@ajabadia/i18n'");
    fs.writeFileSync(requestPath, content, 'utf8');
    console.log(`Updated src/i18n/request.ts for ${satellite}`);
  }
}
