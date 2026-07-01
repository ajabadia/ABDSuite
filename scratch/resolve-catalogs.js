import fs from 'fs';
import path from 'path';

// Read the catalog from pnpm-workspace.yaml using regex to avoid external dependencies
const workspaceYamlPath = path.resolve('pnpm-workspace.yaml');
const workspaceYamlContent = fs.readFileSync(workspaceYamlPath, 'utf8');

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
console.log(catalog);

if (Object.keys(catalog).length === 0) {
  console.error('No catalog entries parsed. Please check YAML parsing.');
  process.exit(1);
}

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
  const pkgPath = path.resolve(satellite, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    console.log(`Skipping ${satellite} (no package.json)`);
    continue;
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  let modified = false;

  const processDeps = (deps) => {
    if (!deps) return;
    for (const [name, version] of Object.entries(deps)) {
      if (version === 'catalog:') {
        if (catalog[name]) {
          deps[name] = catalog[name];
          modified = true;
        } else {
          console.warn(`Warning: No catalog entry found for ${name} in ${satellite}`);
        }
      }
      if (name === '@abd/i18n' && version === 'workspace:*') {
        deps[name] = '^1.0.0';
        modified = true;
      }
    }
  };

  processDeps(pkg.dependencies);
  processDeps(pkg.devDependencies);
  processDeps(pkg.peerDependencies);

  if (modified) {
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
    console.log(`Updated package.json for ${satellite}`);
  } else {
    console.log(`No changes needed for ${satellite}`);
  }
}
