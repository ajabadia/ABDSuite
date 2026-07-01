import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APPS = ['ABDQuiz', 'ABDAnalytics', 'ABDLogs', 'ABDtenantGobernance', 'ABDAuth', 'ABDLanding'];
const BASE_DIR = path.resolve(__dirname, '..');

const REGISTRY_VERSIONS = {
  '@ajabadia/styles': '^1.0.15',
  '@ajabadia/satellite-sdk': '^1.0.11',
  '@ajabadia/ecosystem-widgets': '^1.0.10'
};

for (const app of APPS) {
  const pkgPath = path.join(BASE_DIR, app, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    let modified = false;

    for (const depType of ['dependencies', 'devDependencies']) {
      if (pkg[depType]) {
        for (const [depName, depVal] of Object.entries(pkg[depType])) {
          if (depName in REGISTRY_VERSIONS && (typeof depVal === 'string' && depVal.startsWith('file:'))) {
            pkg[depType][depName] = REGISTRY_VERSIONS[depName];
            console.log(`[${app}] Migrated ${depName}: ${depVal} -> ${REGISTRY_VERSIONS[depName]}`);
            modified = true;
          }
        }
      }
    }

    if (modified) {
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
      console.log(`[${app}] Saved updated package.json`);
    } else {
      console.log(`[${app}] No local file: dependencies found.`);
    }
  }
}
