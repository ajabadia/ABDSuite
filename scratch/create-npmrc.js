const fs = require('fs');
const path = require('path');

const APPS = ['ABDQuiz', 'ABDAnalytics', 'ABDLogs', 'ABDtenantGobernance', 'ABDAuth', 'ABDSatelliteSDK', 'ABDEcosystemWidgets', 'ABDFiles'];
const BASE_DIR = path.resolve(__dirname, '..');

const npmrcContent = `//npm.pkg.github.com/:_authToken=\${GITHUB_NPM_TOKEN}
@ajabadia:registry=https://npm.pkg.github.com
`;

for (const app of APPS) {
  const npmrcPath = path.join(BASE_DIR, app, '.npmrc');
  fs.writeFileSync(npmrcPath, npmrcContent, 'utf8');
  console.log(`Created ${npmrcPath}`);
}
