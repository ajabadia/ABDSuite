import fs from 'fs';
import path from 'path';

const baseDir = 'd:/desarrollos/ABDSuite';

const portMapping = [
  { oldPort: '3399', newPort: '5000', label: 'Landing' },
  { oldPort: '3400', newPort: '5001', label: 'Auth' },
  { oldPort: '3500', newPort: '5002', label: 'Tenants' },
  { oldPort: '3600', newPort: '5003', label: 'Logs' },
  { oldPort: '3700', newPort: '5004', label: 'Analytics' },
  { oldPort: '3800', newPort: '5005', label: 'Files' },
  { oldPort: '3300', newPort: '5020', label: 'Quiz' }
];

// Reemplazos de puerto individuales y con prefijos como : o espacio
function replacePorts(content) {
  let updated = content;
  
  // 1. Reemplazar patrón :PUERTO (ej: localhost:5001)
  for (const { oldPort, newPort } of portMapping) {
    const regex = new RegExp(`:${oldPort}\\b`, 'g');
    updated = updated.replace(regex, `:${newPort}`);
  }
  
  // 2. Reemplazar patrón de argumento -p (ej: -p 5001)
  for (const { oldPort, newPort } of portMapping) {
    const regex = new RegExp(`-p\\s+${oldPort}\\b`, 'g');
    updated = updated.replace(regex, `-p ${newPort}`);
  }

  // 3. Reemplazar en start-all.bat
  // (5000 5001 5002 5003 5004 5005 5020) -> (5000 5001 5002 5003 5004 5005 5020)
  // y descripciones de puertos
  for (const { oldPort, newPort } of portMapping) {
    const regexDesc = new RegExp(`\\(Puerto\\s+${oldPort}\\)`, 'g');
    updated = updated.replace(regexDesc, `(Puerto ${newPort})`);
    
    const regexTitle = new RegExp(`"([^"]+)\\(${oldPort}\\)"`, 'g');
    updated = updated.replace(regexTitle, `"$1(${newPort})"`);
  }

  // Caso específico para la lista de puertos en start-all.bat
  updated = updated.replace(
    /5000 5001 5002 5003 5004 5005 5020/g,
    '5000 5001 5002 5003 5004 5005 5020'
  );
  updated = updated.replace(
    /5000, 5001, 5002, 5003, 5004, 5005, 5020/g,
    '5000, 5001, 5002, 5003, 5004, 5005, 5020'
  );

  return updated;
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Excluir carpetas pesadas/generadas
      if (
        file === 'node_modules' || 
        file === '.next' || 
        file === '.git' || 
        file === 'dist' || 
        file === 'coverage' || 
        file === 'playwright-report'
      ) {
        continue;
      }
      processDirectory(fullPath);
    } else {
      // Solo procesar archivos de configuración, código o scripts relevantes
      const ext = path.extname(file);
      if (
        ext === '.ts' ||
        ext === '.tsx' ||
        ext === '.js' ||
        ext === '.json' ||
        ext === '.mjs' ||
        ext === '.bat' ||
        ext === '.ps1' ||
        file.startsWith('.env')
      ) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const replaced = replacePorts(content);
        if (content !== replaced) {
          fs.writeFileSync(fullPath, replaced, 'utf8');
          console.log(`[UPDATED] ${path.relative(baseDir, fullPath)}`);
        }
      }
    }
  }
}

console.log('Iniciando reemplazo de puertos en la suite...');
processDirectory(baseDir);
console.log('Reemplazo completado con éxito.');
