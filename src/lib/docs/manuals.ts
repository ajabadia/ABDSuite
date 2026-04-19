/**
 * ABDFN Unified Suite - Manuales Técnicos Era 6
 * ABDFN Unified Suite - Manuales Técnicos Era 6
 * Idioma: Castellano (ES)
 * Filosofía: Offline-First / Zero-Knowledge
 */

export const MANUALS = {
  general: {
    title: 'MANUAL GENERAL: ABDFN HUB v6.0',
    content: `
# ⚔️ ABDFN UNIFIED SUITE - ERA 6

Bienvenido al centro de operaciones asépticas de sexta generación. Esta suite ha sido diseñada para la excelencia en el procesamiento masivo con paridad bancaria total y **portabilidad universal**.

## 🏛️ Filosofía del Sistema (Era 6)
- **Offline-First**: Toda la lógica ocurre en el cliente. Ni un solo bit sale a la red.
- **Portabilidad Universal (UUID)**: A diferencia de versiones anteriores, la Era 6 utiliza identificadores únicos universales (UUID). Los datos exportados desde un equipo pueden importarse en cualquier otro sin colisiones de IDs.
- **Zero-Knowledge**: Si pierde su clave maestra, los datos cifrados son irrecuperables.
- **Persistencia Versionada**: El sistema utiliza esquemas de datos versionados (**_v6**) para asegurar migraciones no destructivas y estabilidad a largo plazo.

## 🧭 Mantenimiento y Backup
- **Vuelco Maestro**: Ubicado en la barra lateral, permite realizar copias completas de la base de datos para restauraciones críticas o migración de puesto de trabajo.
- **Dashboard**: Monitoreo de telemetría real y salud del núcleo v6.0.
    `
  },
  crypt: {
    title: 'CRYPT STATION: BLINDAJE',
    content: `
# 🔐 CRYPT STATION - CONTROL CRIPTOGRÁFICO

Blindaje simétrico de grado industrial para la protección de activos de información.

## 🛠️ Tecnologías de Blindaje
- **AES-GCM (256-bit)**: Cifrado autenticado de vanguardia.
- **PBKDF2**: Derivación robusta con 100,000 iteraciones.

## 🚀 Operativas Era 6
1. **Shield Vault**: Blindaje masivo de archivos mediante arrastre. 
2. **Open Key**: Restauración de archivos .ENC garantizando la integridad mediante IV (Vector de Inicialización).

> [!IMPORTANT]
> Las llaves nunca se almacenan en disco; residen solo en memoria volátil por sesión.
    `
  },
  etl: {
    title: 'ETL STUDIO: REFINERÍA',
    content: `
# 📊 ETL STUDIO - TRANSFORMACIÓN ESTRUCTURAL

Motor de refinado estructural para registros asépticos complejos.

## 🏗️ Ciclo Operativo
1. **Designer**: Definición de offsets, longitudes y disparadores (Triggers).
2. **Presets Portables**: Los presupuestos se guardan con UUIDs, facilitando su intercambio entre departamentos.
3. **Executor**: Ingesta masiva con soporte para buffers de gran tamaño.

## 📂 Arquitectura de Datos
Utiliza **IndexedDB** con el motor versionado v6 para garantizar que su configuración esté siempre protegida contra cambios accidentales de esquema.
    `
  },
  letter: {
    title: 'LETTER STATION: GENERACIÓN',
    content: `
# 📄 LETTER STATION - GENERACIÓN GAWEB v6.0

Sistema industrial de emisión de documentos con cumplimiento estricto **GAWEB v.1**.

## 📑 Componentes Era 6
- **Plantillas Universales**: Almacenamiento desacoplado mediante identificadores de cadena.
- **Mapeado Dinámico**: Vinculación matricial entre ETL y placeholders visuales.
- **QA Golden Loop**: Verificación de regresiones mediante comparativa visual SHA-256.

## ⚙️ Rendimiento Industrial
Optimizado para la generación de miles de PDFs de alta fidelidad con inyección de metadatos bancarios en tiempo real.
    `
  },
  audit: {
    title: 'SYSTEM AUDIT: INTEGRIDAD',
    content: `
# 🛡️ SYSTEM AUDIT - CONTROL TÉCNICO

Validación de integridad y cumplimiento normativo de paquetes GAWEB.

## 🔍 Capacidades v6.0
- **Super-Audit Engine**: Streaming de alto rendimiento para archivos de varios gigabytes.
- **Detección de Anomalías**: Verificación de paridad de 300 bytes contra el estándar v.1.
- **Traceability**: Cada auditoría se registra en el histórico industrial con marca de tiempo persistente.

## ⚠️ Cumplimiento Zero-Exfiltration
La suite opera en aislamiento total. Toda librería externa está localmente "vendorizada" y el CSP asegura que ninguna información sea extraída del entorno local.
    `
  }
};
