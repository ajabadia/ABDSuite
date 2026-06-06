import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const satellites = [
  'ABDAnalytics',
  'ABD___BASE',
  'ABDLogs',
  'ABDQuiz',
  'ABDtenantGobernance',
  'ABDLanding'
];

const locales = ['en', 'es'];

console.log('============================================================');
console.log('🔄 Sincronizando Traducciones de logoutSuccess...');
console.log('============================================================');

// Source of truth: ABDFiles
const sourceDir = path.join(rootDir, 'ABDFiles', 'messages');

for (const locale of locales) {
  const sourcePath = path.join(sourceDir, `${locale}.json`);
  if (!fs.existsSync(sourcePath)) {
    console.error(`[ERROR] Archivo origen no encontrado: ${sourcePath}`);
    process.exit(1);
  }

  const sourceData = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  const logoutSuccessBlock = sourceData.logoutSuccess;

  if (!logoutSuccessBlock) {
    console.error(`[ERROR] Bloque 'logoutSuccess' no encontrado en ${sourcePath}`);
    process.exit(1);
  }

  for (const sat of satellites) {
    const targetPath = path.join(rootDir, sat, 'messages', `${locale}.json`);
    if (!fs.existsSync(targetPath)) {
      console.warn(`  [WARN] Archivo no encontrado, saltando: ${sat}/messages/${locale}.json`);
      continue;
    }

    try {
      const targetData = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
      
      // Update the block
      targetData.logoutSuccess = logoutSuccessBlock;

      // Save back with pretty print formatting
      fs.writeFileSync(targetPath, JSON.stringify(targetData, null, 2), 'utf8');
      console.log(`  -> Sincronizado: ${sat}/messages/${locale}.json`);
    } catch (err) {
      console.error(`[ERROR] Fallo al procesar ${sat}/messages/${locale}.json:`, err.message);
    }
  }
}

console.log('OK: Sincronización de traducciones finalizada.');
