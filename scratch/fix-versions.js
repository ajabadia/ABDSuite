const fs = require('fs');
const path = require('path');

const APPS = ['ABDQuiz', 'ABDAnalytics', 'ABDLogs', 'ABDtenantGobernance', 'ABDAuth', 'ABDSatelliteSDK', 'ABDEcosystemWidgets'];
const BASE_DIR = path.resolve(__dirname, '..');

for (const app of APPS) {
  const pkgPath = path.join(BASE_DIR, app, 'package.json');
  if (fs.existsSync(pkgPath)) {
    let content = fs.readFileSync(pkgPath, 'utf8');
    content = content.replace(/"file:\.\.\/ABDStyles"/g, '"latest"');
    content = content.replace(/"file:\.\.\/ABDSatelliteSDK"/g, '"latest"');
    content = content.replace(/"file:\.\.\/ABDEcosystemWidgets"/g, '"latest"');
    fs.writeFileSync(pkgPath, content, 'utf8');
    console.log(`Updated ${pkgPath}`);
  }
}
