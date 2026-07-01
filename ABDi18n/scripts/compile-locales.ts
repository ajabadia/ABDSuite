import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const workspaceDir = path.resolve(rootDir, '..');

const locales = ['es', 'en'];
const localesSourceDir = path.join(rootDir, 'src', 'locales');

// Helper to recursively read files in a directory
function getJsonFiles(dir: string, baseDir: string = dir): { relativePath: string; fullPath: string }[] {
  let results: { relativePath: string; fullPath: string }[] = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getJsonFiles(fullPath, baseDir));
    } else if (file.endsWith('.json')) {
      const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      results.push({ relativePath, fullPath });
    }
  }
  return results;
}

// Helper to set nested object value by path array
function setNestedValue(obj: any, pathArray: string[], value: any) {
  let current = obj;
  for (let i = 0; i < pathArray.length - 1; i++) {
    const part = pathArray[i];
    if (!current[part]) {
      current[part] = {};
    }
    current = current[part];
  }
  const lastPart = pathArray[pathArray.length - 1];
  current[lastPart] = value;
}

// Deep merge utility
function deepMerge(target: any, source: any) {
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

// Flat keys generator
function getFlatKeys(obj: any, prefix = ''): { [key: string]: string } {
  let keys: { [key: string]: string } = {};
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      keys = { ...keys, ...getFlatKeys(obj[key], fullKey) };
    } else {
      keys[fullKey] = obj[key];
    }
  }
  return keys;
}

// main execution
async function main() {
  const isLint = process.argv.includes('--lint');
  console.log(`============================================================`);
  console.log(isLint ? '🔍 Ejecutando Linter de Internacionalización...' : '⚙️ Consolidando Archivos de Traducción...');
  console.log(`============================================================`);

  const merged: { [locale: string]: any } = { es: {}, en: {} };

  // 1. Process files
  for (const locale of locales) {
    const localeDir = path.join(localesSourceDir, locale);
    if (!fs.existsSync(localeDir)) {
      fs.mkdirSync(localeDir, { recursive: true });
    }

    const files = getJsonFiles(localeDir);
    for (const file of files) {
      try {
        const content = JSON.parse(fs.readFileSync(file.fullPath, 'utf8'));
        // e.g. path relative is "auth/login.json" -> ["auth", "login"]
        const parts = file.relativePath.replace(/\.json$/, '').split('/');
        setNestedValue(merged[locale], parts, content);
      } catch (err: any) {
        console.error(`[ERROR] Error al procesar JSON en ${file.fullPath}:`, err.message);
        process.exit(1);
      }
    }
  }

  // 2. Validate parity of keys
  const esFlat = getFlatKeys(merged.es);
  const enFlat = getFlatKeys(merged.en);

  let hasErrors = false;
  const missingInEn: string[] = [];
  const missingInEs: string[] = [];

  for (const key of Object.keys(esFlat)) {
    if (enFlat[key] === undefined) {
      missingInEn.push(key);
    }
  }

  for (const key of Object.keys(enFlat)) {
    if (esFlat[key] === undefined) {
      missingInEs.push(key);
    }
  }

  if (missingInEn.length > 0) {
    console.warn(`⚠️ [WARN] Claves declaradas en Español ('es') pero faltantes en Inglés ('en'):`);
    missingInEn.forEach(k => console.warn(`   - ${k}`));
    if (isLint) hasErrors = true;
  }

  if (missingInEs.length > 0) {
    console.warn(`⚠️ [WARN] Claves declaradas en Inglés ('en') pero faltantes en Español ('es'):`);
    missingInEs.forEach(k => console.warn(`   - ${k}`));
    if (isLint) hasErrors = true;
  }

  // Fallback fallback: copy values if not linting
  if (!isLint) {
    // Fill missing keys in en with es values
    for (const key of missingInEn) {
      const parts = key.split('.');
      setNestedValue(merged.en, parts, esFlat[key]);
    }
    // Fill missing keys in es with en values
    for (const key of missingInEs) {
      const parts = key.split('.');
      setNestedValue(merged.es, parts, enFlat[key]);
    }

    // Write final output files to src/locales/es.json and src/locales/en.json
    fs.writeFileSync(path.join(localesSourceDir, 'es.json'), JSON.stringify(merged.es, null, 2), 'utf8');
    fs.writeFileSync(path.join(localesSourceDir, 'en.json'), JSON.stringify(merged.en, null, 2), 'utf8');
    console.log(`✅ Ficheros finales generados:`);
    console.log(`   - ${path.join(localesSourceDir, 'es.json')}`);
    console.log(`   - ${path.join(localesSourceDir, 'en.json')}`);
  }

  // 3. Scan for orphan keys across the monorepo (only if --lint or explicitly requested)
  if (isLint) {
    console.log('\n🔍 Buscando claves huérfanas en el monorepo (código fuente)...');
    
    // Satellites to scan
    const satellites = [
      'ABDAnalytics',
      'ABDAuth',
      'ABDFiles',
      'ABDLanding',
      'ABDLogs',
      'ABDQuiz',
      'ABDtenantGobernance',
      'ABD___BASE',
      'ABDSatelliteSDK',
      'ABDEcosystemWidgets'
    ];

    const referencedKeys = new Set<string>();

    // Scan directories
    for (const sat of satellites) {
      const satDir = path.join(workspaceDir, sat, 'src');
      if (!fs.existsSync(satDir)) continue;

      const scanDir = (dir: string) => {
        const list = fs.readdirSync(dir);
        for (const file of list) {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          if (stat && stat.isDirectory()) {
            scanDir(fullPath);
          } else if (/\.(tsx|ts|js|jsx)$/.test(file)) {
            const content = fs.readFileSync(fullPath, 'utf8');
            // Check for useTranslations namespaces and keys
            // A simple check is to search for the translation keys or leaf names
            for (const key of Object.keys(esFlat)) {
              // Exact match or parts of the namespace + leaf match
              const parts = key.split('.');
              const lastPart = parts[parts.length - 1];
              // Search for the translation key or leaf key string
              if (content.includes(`'${lastPart}'`) || content.includes(`"${lastPart}"`) || content.includes(`\`${lastPart}\``) || content.includes(key)) {
                referencedKeys.add(key);
              }
            }
          }
        }
      };
      scanDir(satDir);
    }

    const orphanKeys: string[] = [];
    for (const key of Object.keys(esFlat)) {
      if (!referencedKeys.has(key)) {
        // Exclude common blocks that are standard template widgets
        if (!key.startsWith('widgets.') && !key.startsWith('settings.') && !key.startsWith('logoutSuccess.') && !key.startsWith('common.')) {
          orphanKeys.push(key);
        }
      }
    }

    if (orphanKeys.length > 0) {
      console.warn(`\n⚠️ [WARN] Se detectaron ${orphanKeys.length} posibles claves huérfanas (definidas en JSON pero no encontradas en el código de ningún satélite):`);
      orphanKeys.slice(0, 50).forEach(k => console.warn(`   - ${k}`));
      if (orphanKeys.length > 50) console.warn(`   ... y ${orphanKeys.length - 50} claves más.`);
    } else {
      console.log('✅ Cero claves huérfanas detectadas en los satélites analizados.');
    }
  }

  if (hasErrors) {
    console.error('\n❌ Error: Paridad de traducciones rota.');
    process.exit(1);
  } else {
    console.log('\n🚀 Proceso completado correctamente.');
  }
}

main().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
