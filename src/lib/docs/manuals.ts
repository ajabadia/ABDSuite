/**
 * ABDFN Unified Suite - Manuales Técnicos Era 5
 * Idioma: Castellano (ES)
 * Filosofía: Offline-First / Zero-Knowledge
 */

export const MANUALS = {
  general: {
    title: 'MANUAL GENERAL: ABDFN HUB v5.0',
    content: `
# ⚔️ ABDFN UNIFIED SUITE - ERA 5

Bienvenido al centro de operaciones asépticas. Esta suite ha sido diseñada para el procesamiento masivo de datos con paridad bancaria total y blindaje criptográfico de grado industrial.

## 🏛️ Filosofía del Sistema
- **Offline-First**: Toda la lógica ocurre en su navegador. Nada sale a la red.
- **Zero-Knowledge**: El sistema no conoce sus contraseñas. Si pierde su clave maestra, los datos cifrados son irrecuperables.
- **Asepsia Técnica**: Interfaces minimalistas diseñadas para la eficiencia operativa y reducción de fatiga visual.

## 🧭 Navegación Global
- **Dashboard**: Vista de telemetría real y acceso rápido a módulos.
- **Centro de Ayuda**: Acceso a esta documentación en cualquier momento.
- **Sidebar**: Control de flujo entre las distintas estaciones de trabajo.
    `
  },
  crypt: {
    title: 'CRYPT STATION: BLINDAJE',
    content: `
# 🔐 CRYPT STATION - CONTROL CRIPTOGRÁFICO

Módulo dedicado a la protección de datos sensibles mediante algoritmos simétricos.

## 🛠️ Tecnologías de Blindaje
- **AES-GCM (256-bit)**: Estándar industrial para cifrado autenticado.
- **PBKDF2**: Derivación de claves con 100,000 iteraciones para máxima resistencia.

## 🚀 Operativas Comunes
1. **Shield Vault**: Arrastre archivos para cifrarlos masivamente. Requiere una contraseña maestra.
2. **Open Key**: Proceso inverso para restaurar archivos .ENC a su estado original.

> [!IMPORTANT]
> Las contraseñas se mantienen exclusivamente en la memoria volátil de la sesión actual.
    `
  },
  etl: {
    title: 'ETL STUDIO: REFINERÍA',
    content: `
# 📊 ETL STUDIO - TRANSFORMACIÓN ESTRUCTURAL

Motor para la ingesta y remodelado de registros asépticos.

## 🏗️ Flujo de Trabajo
1. **Designer**: Defina los tipos de registro y los campos (offsets, longitudes, comportamientos).
2. **Presets**: Guarde sus configuraciones como archivos JSON industriales.
3. **Executor**: Procese archivos masivos aplicando las reglas definidas en el Designer.

## 📂 Almacenamiento
Utiliza **IndexedDB** para manejar millones de registros localmente sin degradar el rendimiento del sistema.
    `
  },
  letter: {
    title: 'LETTER STATION: GENERACIÓN',
    content: `
# 📄 LETTER STATION - GENERACIÓN GAWEB

Sistema de emisión masiva cumpliendo con la paridad **GAWEB v.1**.

## 📑 Componentes Clave
- **Plantillas**: Definición visual y estructural de los documentos.
- **Mapeado**: Vinculación dinámica entre los campos de su ETL y los campos de la plantilla.
- **Generación**: Creación de paquetes de datos listos para el host bancario.

## ⚙️ Configuración Industrial
Ajuste los prefijos, backups automáticos y rutas de salida mediante la Native File System API.
    `
  },
  audit: {
    title: 'SYSTEM AUDIT: INTEGRIDAD',
    content: `
# 🛡️ SYSTEM AUDIT - CONTROL TÉCNICO

Última línea de defensa antes del envío a producción.

## 🔍 Funciones de Auditoría
- **GAWEB Auditor**: Valida archivos .txt carácter a carácter (300 bytes de paridad).
- **Verificación ZIP**: Asegura que todos los PDFs referenciados existan en el paquete.
- **MD5 Mismatch**: Compara hashes para detectar corrupciones en el transporte.

## ⚠️ Severidades
- **ERROR**: Bloquea el proceso. Debe corregirse en origen (ETL o Letter).
- **ADVERTENCIA**: Posible anomalía no crítica que requiere revisión manual.
    `
  }
};
