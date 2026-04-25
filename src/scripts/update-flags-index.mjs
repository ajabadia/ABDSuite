import fs from 'fs';
import path from 'path';

const flagsDir = 'd:\\desarrollos\\ABDFNSuite\\src\\components\\icons\\flags';
const files = fs.readdirSync(flagsDir);

const exports = files
    .filter(f => f.endsWith('.tsx') && f !== 'index.tsx' && f !== 'index.ts')
    .map(f => `export * from './${f.replace('.tsx', '')}';`)
    .join('\n');

fs.writeFileSync(path.join(flagsDir, 'index.ts'), exports);
console.log('Updated index.ts with ' + exports.split('\n').length + ' exports.');
