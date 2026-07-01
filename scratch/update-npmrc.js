import fs from 'fs';
import path from 'path';

const npmrcContent = `//npm.pkg.github.com/:_authToken=\${GITHUB_NPM_TOKEN}
@ajabadia:registry=https://npm.pkg.github.com
@abd:registry=https://npm.pkg.github.com
`;

// 1. Root .npmrc
fs.writeFileSync('.npmrc', npmrcContent, 'utf8');
console.log('Created/Updated root .npmrc');

// 2. Satellites .npmrc
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
  const npmrcPath = path.resolve(satellite, '.npmrc');
  fs.writeFileSync(npmrcPath, npmrcContent, 'utf8');
  console.log(`Created/Updated .npmrc for ${satellite}`);
}
