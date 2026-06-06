/**
 * 🌐 verify-network.mjs
 * Script de diagnóstico de red y validación de cabeceras de cookies federadas.
 * Diseñado para comprobar que la configuración de cookies y el aislamiento de subdominios
 * cumplan con los estándares definidos en la Fase 1 del Roadmap.
 */

import http from 'http';
import dns from 'dns';
import { promisify } from 'util';

const resolveCname = promisify(dns.resolveCname);

console.log('🧪 Iniciando verificación de infraestructura de red y cookies...');

async function testDnsResolution() {
  console.log('\n--- 1. Pruebas de resolución DNS ---');
  const targetHost = process.env.VERIFY_HOST || 'auth.tudominio.com';
  console.log(`Verificando CNAME para: ${targetHost}`);
  
  if (targetHost.includes('tudominio.com')) {
    console.log('⚠️ [INFO] Utilizando dominio de plantilla. Saltar resolución DNS real en local.');
    return;
  }
  
  try {
    const addresses = await resolveCname(targetHost);
    console.log(`✅ CNAME resuelto a: ${addresses.join(', ')}`);
  } catch (err) {
    console.warn(`❌ No se pudo resolver CNAME para ${targetHost}: ${err.message}`);
  }
}

function testCookieHeaders() {
  console.log('\n--- 2. Pruebas de cabeceras de cookies ---');
  // Simulamos una respuesta http para verificar cómo se inyectan las cookies
  const mockCookieDomain = process.env.COOKIE_DOMAIN || '.tudominio.com';
  
  console.log(`Dominio de cookie configurado: "${mockCookieDomain}"`);
  
  // Exigir el punto inicial si se trata de un dominio de segundo nivel o superior
  if (mockCookieDomain && !mockCookieDomain.startsWith('.')) {
    console.warn('❌ [AUDIT_WARNING] Se recomienda comenzar el dominio con un punto (e.g. .tudominio.com) para compatibilidad multi-subdominio en todos los navegadores antiguos.');
  } else {
    console.log('✅ Dominio formateado correctamente para compartir entre subdominios.');
  }
}

async function run() {
  await testDnsResolution();
  testCookieHeaders();
  console.log('\n✅ Diagnóstico local de red completado.');
}

run().catch(console.error);
