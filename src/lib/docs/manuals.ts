/**
 * ABDFN Unified Suite - Manuales Técnicos Era 6
 * Idioma: Castellano (ES)
 * Filosofía: Offline-First / Zero-Knowledge / At-Rest Encryption
 */

export const MANUALS = {
  general: {
    title: 'MANUAL GENERAL: ABDFN HUB v6.1-IND',
    content: `
# ⚔️ ABDFN UNIFIED SUITE - ERA 6 (v6.1.0)

Bienvenido al centro de operaciones asépticas de sexta generación. Esta suite ha sido diseñada para la excelencia industrial, garantizando la **Privacidad At-Rest** y la **Portabilidad Universal**.

## 🏛️ Filosofía de Seguridad (Era 6.1)
- **Cifrado At-Rest Total**: Toda la base de datos IndexedDB está cifrada mediante AES-GCM-256. Ningún dato es legible fuera de esta aplicación.
- **Root of Trust (Installation Key)**: El motor criptográfico depende de una Clave de Instalación (IK) única. Sin esta clave desbloqueada, el acceso a los datos de la unidad está restringido.
- **Offline-First**: Toda la lógica ocurre en su navegador. Ni un solo bit sale a la red.
- **Portabilidad Universal (UUID)**: Los datos son compatibles entre diferentes instalaciones mediante el uso de identificadores universales.

## 🧭 Mantenimiento y Seguridad de Datos
- **Vuelco de Datos Industriales**: Permite realizar copias de seguridad de plantillas, configuraciones y auditorías. Por seguridad, los operadores y las claves maestras **no** se incluyen en estos volcados para evitar colisiones entre plantas.
- **Estado del Motor**: Si el icono de seguridad de la barra lateral está bloqueado, deberá iniciar sesión como administrador para habilitar las funciones de exportación/importación.
    `
  },
  crypt: {
    title: 'CRYPT STATION: BLINDAJE',
    content: `
# 🔐 CRYPT STATION - CONTROL CRIPTOGRÁFICO

Blindaje simétrico de grado industrial para la protección de activos de información.

## 🛠️ Tecnologías de Blindaje
- **AES-GCM (256-bit)**: Cifrado autenticado de vanguardia para archivos externos.
- **Industrial Key Derivation**: Uso de PBKDF2 con 100,000 iteraciones para garantizar que sus contraseñas sean resistentes a ataques de fuerza bruta.

## 🔐 Protección del Núcleo
El sistema utiliza un motor de cifrado persistente para sus propios datos. Asegúrese de guardar su **Installation Key** en un lugar seguro; su pérdida implica la pérdida total de los datos de la suite.

> [!IMPORTANT]
> Las llaves de sesión (Session Keys) residen solo en memoria volátil y se destruyen al cerrar la pestaña o bloquear el puesto.
    `
  },
  etl: {
    title: 'ETL STUDIO: REFINERÍA',
    content: `
# 📊 ETL STUDIO - TRANSFORMACIÓN ESTRUCTURAL

Motor de refinado estructural para registros asépticos complejos.

## 🏗️ Ciclo Operativo
1. **Designer**: Definición visual de modelos de datos.
2. **Execution Gate**: Solo los operarios autorizados pueden ejecutar transformaciones masivas sobre la base de datos cifrada.
3. **Persistencia Segura**: Cada registro procesado se almacena instantáneamente bajo la capa de cifrado At-Rest.
    `
  },
  letter: {
    title: 'LETTER STATION: GENERACIÓN',
    content: `
# 📄 LETTER STATION - GENERACIÓN GAWEB v6.1

Sistema industrial de emisión de documentos con cumplimiento estricto **GAWEB v.1**.

## 📑 Componentes de Seguridad
- **Plantillas Cifradas**: Sus diseños de cartas están protegidos contra accesos no autorizados mediante IndexedDB cifrada.
- **QA Golden Loop**: Verificación de integridad SHA-256 para asegurar que cada PDF generado sea idéntico al modelo de referencia.
    `
  },
  audit: {
    title: 'SYSTEM AUDIT: INTEGRIDAD',
    content: `
# 🛡️ SYSTEM AUDIT - SUPERVISIÓN FORENSE

Monitoreo de integridad y cumplimiento normativo de la suite.

## 🔍 Taxonomía Forense v6.1
El sistema clasifica cada acción en 5 categorías críticas para facilitar auditorías de cumplimiento:
- **AUTH**: Fallos de login, bloqueos de sesión y accesos MFA.
- **RBAC**: Cambios en permisos, creación de operarios y elevación de roles.
- **CONFIG**: Cambios en seguridad global o ajustes del sistema.
- **DATA**: Exportaciones (Dumps), importaciones y procesos masivos de datos.
- **SYSTEM**: Ciclo de vida del núcleo, purgas de retención y mantenimiento.

## 📊 Security Dashboard
El panel ofrece KPIs en tiempo real para detectar anomalías de seguridad antes de que se conviertan en incidentes.
    `
  }
};
