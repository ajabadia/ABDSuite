const fs = require('fs');
const path = require('path');

const dirs = [
  'ABDAnalytics',
  'ABDAuth',
  'ABDFiles',
  'ABDLanding',
  'ABDLogs',
  'ABDQuiz',
  'ABDtenantGobernance',
  'ABD___BASE'
];

dirs.forEach(dir => {
  const pkgPath = path.join(__dirname, '..', dir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    let content = fs.readFileSync(pkgPath, 'utf8');
    content = content.replace(/"@ajabadia\/satellite-sdk":\s*"[^"]*"/, '"@ajabadia/satellite-sdk": "workspace:*"');
    fs.writeFileSync(pkgPath, content, 'utf8');
    console.log(`Updated @ajabadia/satellite-sdk dependency to workspace:* in ${dir}/package.json`);
  } else {
    console.log(`package.json not found in ${dir}`);
  }
});
