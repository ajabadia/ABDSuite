import fs from 'fs';
import path from 'path';

// Read catalog from pnpm-workspace.yaml using regex
const workspaceYamlContent = fs.readFileSync('pnpm-workspace.yaml', 'utf8');
const catalog = {};
let inCatalog = false;

for (const line of workspaceYamlContent.split(/\r?\n/)) {
  if (line.trim() === 'catalog:') {
    inCatalog = true;
    continue;
  }
  if (inCatalog) {
    if (line.trim() === '' || (line.startsWith(' ') && !line.startsWith('  ')) || (!line.startsWith(' ') && line.includes(':'))) {
      if (line.trim() !== '' && !line.startsWith('  ')) {
        inCatalog = false;
      }
    }
    if (inCatalog) {
      const match = line.match(/^\s+['"]?([^'":\s]+)['"]?:\s*['"]?([^'"]+)['"]?/);
      if (match) {
        catalog[match[1]] = match[2];
      }
    }
  }
}

console.log('Parsed Catalog entries:', Object.keys(catalog).length);

// Target ABD___BASE
const targetDir = 'ABD___BASE';

// 1. Update package.json
const pkgPath = path.resolve(targetDir, 'package.json');
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  const processDeps = (deps) => {
    if (!deps) return;
    for (const [name, version] of Object.entries(deps)) {
      if (version === 'catalog:') {
        if (catalog[name]) {
          deps[name] = catalog[name];
        }
      }
      if (name === '@abd/i18n') {
        delete deps[name];
        deps['@ajabadia/i18n'] = '^1.0.0';
      }
    }
  };

  processDeps(pkg.dependencies);
  processDeps(pkg.devDependencies);
  processDeps(pkg.peerDependencies);

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  console.log(`Updated package.json for ${targetDir}`);
}

// 2. Update src/i18n/request.ts
const requestPath = path.resolve(targetDir, 'src', 'i18n', 'request.ts');
if (fs.existsSync(requestPath)) {
  let content = fs.readFileSync(requestPath, 'utf8');
  content = content.replace(/['"]@abd\/i18n['"]/g, "'@ajabadia/i18n'");
  fs.writeFileSync(requestPath, content, 'utf8');
  console.log(`Updated src/i18n/request.ts for ${targetDir}`);
}
