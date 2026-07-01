import { execSync } from 'child_process';
import path from 'path';

const projects = [
  'ABDLanding',
  'ABDAnalytics',
  'ABDLogs',
  'ABDQuiz',
  'ABDAuth',
  'ABDtenantGobernance',
  'ABDFiles'
];

const vars = [
  { name: 'UPSTASH_REDIS_REST_URL', value: 'https://sterling-porpoise-34640.upstash.io' },
  { name: 'UPSTASH_REDIS_REST_TOKEN', value: 'AYdQAAIncDI5Njg3YTIyZDlhOTM0ZTUyOTYzZWE5MjM0NjU1ZWU5MHAyMzQ2NDA' }
];

console.log('Iniciando configuración de variables de entorno de Redis en Vercel...');

for (const project of projects) {
  console.log(`\n========================================`);
  console.log(`Procesando Proyecto: ${project}`);
  console.log(`========================================`);

  for (const v of vars) {
    try {
      console.log(`Añadiendo ${v.name} = ${v.value}...`);
      const cmd = `npx vercel env add ${v.name} production --value "${v.value}" --yes --force`;
      const output = execSync(cmd, { cwd: path.resolve(project), encoding: 'utf-8' });
      console.log(output);
    } catch (error) {
      console.warn(`[WARN] No se pudo añadir ${v.name} a ${project}: ${error.message}`);
    }
  }
}

console.log('\nConfiguración de variables de Redis en Vercel completada.');
