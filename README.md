# ⚔️ ABDFN Unified Suite (v6.1.0-IND)

**Excelencia en Procesamiento Local Aséptico, Paridad Bancaria GAWEB v.1 y Seguridad Industrial At-Rest.**

ABDFN Unified Suite es una plataforma modular de grado industrial de **Era 6**, diseñada para operaciones críticas de datos mediante tecnología **Offline-First**. Optimizada para el cumplimiento del estándar **Aseptic v6.1**, garantiza que el procesamiento masivo de documentos y el blindaje criptográfico ocurran íntegramente en el cliente con paridad absoluta y portabilidad universal.

## 🏛️ El Ecosistema Modular (The Shell)

La suite organiza las operativas en estaciones de trabajo especializadas, guiadas por un **Wizard Progresivo Dinámico**:

- **🔐 CRYPT STATION:** Suite criptográfica avanzada **AES-256-GCM**.
  - **Shield Vault:** Blindaje masivo con derivados de **PBKDF2** (100,000 iteraciones).
  - **Open Key:** Descifrado seguro con validación de integridad IV.
- **📊 ETL STUDIO:** Motor de transformación estructural de alta fidelidad.
  - **Designer:** Modelado visual de registros y segregación técnica.
  - **Executor:** Procesamiento de grandes volúmenes con persistencia IndexDB.
- **📄 LETTER STATION:** Motor de generación de documentos con paridad total **GAWEB v.1**.
  - **Universal UUIDs:** Identificación única universal para garantizar la sincronización entre operadores sin colisiones.
  - **I18N Quad-Sync:** Soporte nativo para **ES, EN, FR, DE** en toda la interfaz.
- **🛡️ SYSTEM AUDIT:** Auditoría técnica y supervisión forense.
  - **Security Dashboard:** Visualización de KPIs de seguridad en tiempo real (Auth fails, RBAC alts).
  - **Categorical Taxonomy:** Clasificación unificada de eventos en `AUTH`, `RBAC`, `CONFIG`, `DATA` y `SYSTEM`.
- **🌍 REGTECH STATION:** Motor de cumplimiento jurisdiccional global (Era 6.5).
  - **Jurisdictional Core:** Validación de TINs para +100 países con **Elocuencia Proactiva**.
  - **Batch Industrial:** Procesamiento masivo con detección automática de columnas y exportación enriquecida.

## 🚀 Innovaciones Era 6 (Aseptic v6.1)

- **🔒 Industrial At-Rest Encryption**: Implementación de cifrado total de base de datos (`AES-GCM-256`) mediante el motor `EncryptedDbAdapter`. Todos los datos locales están protegidos incluso si el archivo de base de datos es extraído físicamente.
- **🔑 Installation Key (IK) Root of Trust**: Introducción de la Llave de Instalación como ancla de seguridad principal. El acceso a los datos de la unidad está bloqueado hasta que el administrador maestro desbloquea el motor criptográfico.
- **🆔 Universal Portability Standard**: Transición completa a UUIDs en el núcleo de datos, permitiendo el intercambio de backups (**"Vuelco de Datos Industriales"**) entre múltiples equipos sin colisiones de identidad.
- **🌍 I18N Parity Engine**: Sistema de internacionalización síncrono que elimina el texto hardcoded, asegurando una experiencia uniforme en 4 idiomas.
- **🛠️ Wizard Industrial Progresivo**: Interfaz en cascada que guía al operador, bloqueando acciones críticas hasta que se satisfacen todos los requisitos de seguridad.

## 🛡️ Security Model (RBAC & Forensic)

ABDFN Suite usa un modelo de **Role‑Based Access Control (RBAC)** combinado con auditoría de grado forense:

- **ADMIN**: Gobierno total de la instalación, gestión de operadores y desbloqueo de la **Installation Key**.
- **TECH**: Diseño de modelos (ETL, LETTER), ejecución de procesos y acceso a herramientas de auditoría técnica.
- **OPERATOR**: Ejecución de flujos diarios definidos (cifrar, generar documentos) sin acceso a la configuración estructural.

Para más detalles, consulte la [guía de roles y permisos](docs/ROLES_AND_PERMISSIONS.md).

## 🛠️ Especificaciones Técnicas

- **Core:** Next.js 16.2.3 (Turbopack), TypeScript 5.x, React 19.
- **Criptografía:** WebCrypto API (AES-GCM-256, PBKDF2), At-Rest Protection.
- **Base de Datos:** Dexie.js (IndexedDB) v4.4 con arquitectura cifrada y versionada.
- **Estética:** Industrial High-Fidelity (Aseptic Retro-Minimalist), Vanilla CSS.
- **Cumplimiento:** Aseptic Standard v6.1 (Zero-Knowledge, Local-Only, forensic audit).

---

**© 2026 ABD INDUSTRIAL INFRASTRUCTURES** | *Privacidad por Diseño. Blindaje por Arquitectura. Portabilidad por Era.*
