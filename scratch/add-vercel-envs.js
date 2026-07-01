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
  { name: 'COOKIE_DOMAIN', value: '.abdia.es' },
  { name: 'NEXT_PUBLIC_ROOT_DOMAIN', value: 'abdia.es' }
];

console.log('Iniciando configuración de variables de entorno en Vercel...');

for (const project of projects) {
  console.log(`\n========================================`);
  console.log(`Procesando Proyecto: ${project}`);
  console.log(`========================================`);

  for (const v of vars) {
    try {
      console.log(`Añadiendo ${v.name} = ${v.value}...`);
      // Ejecutamos vercel env add de forma no interactiva con --yes y --force si es necesario
      // Usamos execSync con cwd apuntando a la carpeta del proyecto
      const cmd = `npx vercel env add ${v.name} production --value "${v.value}" --yes --force`;
      const output = execSync(cmd, { cwd: path.resolve(project), encoding: 'utf-8' });
      console.log(output);
    } catch (error) {
      // Si ya existe o hay otro error, lo reportamos y continuamos
      console.warn(`[WARN] No se pudo añadir ${v.name} a ${project}: ${error.message}`);
    }
  }
}

console.log('\nConfiguración de variables de Vercel completada.');
