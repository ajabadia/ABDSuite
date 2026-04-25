# 00-Context: Visión y Ecosistema (Era 6.1)

## 1. Objetivo del Proyecto
**ABDFN Unified Suite** es una plataforma modular de grado industrial diseñada para operaciones críticas de datos mediante tecnología **Offline-First**. Su propósito es garantizar el procesamiento masivo de documentos, el blindaje criptográfico y la generación de reportes con paridad absoluta (GAWEB v1) sin depender de servidores externos, asegurando la privacidad por diseño y el blindaje por arquitectura.

> [!IMPORTANT]
> **ERA ACTUAL: ERA 6.1 - Industrial Aseptic Standards**
> El foco actual es la consolidación de la **Installation Key (IK)**, la paridad universal mediante **UUIDs** y la optimización del motor de generación de documentos en cascada.

## 2. Stack Tecnológico (Industrial Core)
- **Frontend**: Next.js 16.2.3 (Turbopack) + React 19.
- **Lógica de Negocio**: 100% Client-Side Services (Offline-First).
- **Criptografía**: WebCrypto API (AES-GCM-256, PBKDF2) + At-Rest Encryption.
- **Base de Datos**: Dexie.js (IndexedDB) con arquitectura cifrada y versionada.
- **Estética**: Industrial High-Fidelity (Aseptic Retro-Minimalist) usando Vanilla CSS.
- **Internacionalización**: I18N Quad-Sync (ES, EN, FR, DE).

## 3. Filosofía de Desarrollo
- **Zero-Knowledge Architecture**: Ningún dato sensible sale del equipo del operador.
- **Aseptic Processing**: El procesamiento de archivos debe ser limpio, sin efectos secundarios en red y con gestión estricta de memoria (Buffer Hygiene).
- **Industrial Parity**: Los resultados generados deben ser idénticos a los estándares bancarios y regulatorios establecidos.
- **Self-Contained Portability**: El sistema permite el volcado y restauración de datos industriales entre terminales mediante backups cifrados.

## 4. Audiencia y Roles (RBAC)
- **ADMIN**: Gestión de la instalación, operadores y desbloqueo de la Installation Key.
- **TECH**: Diseño de modelos ETL, Letter templates y auditoría técnica.
- **OPERATOR**: Ejecución de flujos diarios (cifrar, procesar, generar) en entornos de confianza cero.

## 5. Glosario de Términos (Industrial Taxonomy)
- **Installation Key (IK)**: Root of trust. Bloquea el motor criptográfico hasta su validación.
- **Crypt Station**: Centro de mando para operaciones AES-GCM y gestión de bóvedas (Vaults).
- **ETL Studio**: Motor de transformación estructural de alta fidelidad.
- **Letter Station**: Generador de documentos con paridad total GAWEB v1.
- **Universal UUID**: Identificador único que garantiza la sincronización entre equipos sin colisiones.
- **Shield Vault**: Almacenamiento local blindado mediante derivados de PBKDF2.
