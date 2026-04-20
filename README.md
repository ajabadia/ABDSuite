# ⚔️ ABDFN Unified Suite (v6.0.0-IND)

**Excelencia en Procesamiento Local Aséptico, Paridad Bancaria GAWEB v.1 e i18n Quad-Sync.**

ABDFN Unified Suite es una plataforma modular de grado industrial de **Era 6**, diseñada para operaciones críticas de datos mediante tecnología **Offline-First**. Optimizada para el cumplimiento del estándar **Aseptic v6.0**, garantiza que el procesamiento masivo de documentos y el blindaje criptográfico ocurran íntegramente en el cliente con paridad absoluta y portabilidad universal.

## 🏛️ El Ecosistema Modular (The Shell)

La suite organiza las operativas en estaciones de trabajo especializadas, guiadas por un **Wizard Progresivo Dinámico**:

- **🔐 CRYPT STATION:** Suite criptográfica avanzada **AES-256-GCM**.
  - **Shield Vault:** Blindaje masivo con derivados de **PBKDF2** (100,000 iteraciones).
  - **Open Key:** Descifrado seguro con validación de integridad IV.
- **📊 ETL STUDIO:** Motor de transformación estructural de alta fidelidad.
  - **Designer:** Modelado visual de registros y segregación técnica.
  - **Executor:** Procesamiento de grandes volúmenes con persistencia IndexDB.
- **📄 LETTER STATION (Era 6 Portability):** Motor de generación de documentos con paridad total **GAWEB v.1**.
  - **Universal UUIDs:** Identificación única universal para garantizar la sincronización entre operadores sin colisiones.
  - **I18N Quad-Sync:** Soporte nativo para **ES, EN, FR, DE** en toda la interfaz.
- **🛡️ SYSTEM AUDIT:** Auditoría técnica y validación de paridad.
  *   **GAWEB Auditor:** Validador en tiempo real de archivos `.txt` contra el manual oficial de diseño v.1.

## 🚀 Innovaciones Era 6 (Aseptic v6.0)

- **🆔 Universal Portability Standard:** Transición completa a UUIDs en el núcleo de datos, permitiendo el intercambio de backups ("Vuelco Maestro") entre múltiples equipos y empleados.
- **📈 Versioned Industrial Stores:** Implementación de tablas `_v6` para migraciones de esquema no destructivas y evolución continua del motor.
- **🌍 I18N Parity Engine:** Sistema de internacionalización síncrono que elimina el texto hardcoded, asegurando una experiencia uniforme en 4 idiomas.
- **🔒 AES-GCM 256 Shield:** Implementación nativa de la API `SubtleCrypto` para blindaje simétrico de grado bancario.
- **🛠️ Wizard Industrial Progresivo:** Interfaz en cascada que guía al operador, bloqueando acciones críticas hasta que se satisfacen todos los requisitos.

## 🛡️ Security model (RBAC)

ABDFN Suite usa un modelo de **Role‑Based Access Control (RBAC)**: cada usuario pertenece a un rol (ADMIN, TECH u OPERATOR) y cada rol tiene un conjunto de permisos sobre los módulos de la suite (CRYPT, ETL, LETTER, AUDIT, Supervisor).
En lugar de asignar permisos uno a uno a cada usuario, definimos capacidades de alto nivel (por ejemplo `LETTER_GENERATE`, `ETL_RUN`, `AUDIT_CONFIG`) y las vinculamos a cada rol, manteniendo el sistema simple y auditable.

- **ADMIN** puede gobernar toda la instalación: configuración global, gestión de operadores y acceso completo a todos los módulos.
- **TECH** se centra en tareas técnicas: diseña modelos (ETL, LETTER), ejecuta procesos y auditorías, pero no puede cambiar la configuración global ni la estructura de usuarios.
- **OPERATOR** utiliza los flujos diarios (cifrar, ejecutar ETL, generar cartas, lanzar auditorías) sin modificar plantillas, modelos o políticas globales.

Para más detalles, consulte la [guía de roles y permisos](docs/ROLES_AND_PERMISSIONS.md).

### RBAC overview

```mermaid
flowchart LR
  subgraph Users
    U1[User A\n(admin)]
    U2[User B\n(tech)]
    U3[User C\n(operator)]
  end

  subgraph Roles
    R1[ADMIN]
    R2[TECH]
    R3[OPERATOR]
  end

  subgraph Capabilities
    C1[CRYPT_USE]
    C2[ETL_EDIT_PRESETS]
    C3[LETTER_GENERATE]
    C4[AUDIT_CONFIG]
    C5[OPERATORS_MANAGE]
  end

  subgraph Modules
    M1[CRYPT STATION]
    M2[ETL STUDIO]
    M3[LETTER STATION]
    M4[SYSTEM AUDIT]
    M5[SUPERVISOR]
  end

  U1 --> R1
  U2 --> R2
  U3 --> R3

  R1 --> C1
  R1 --> C2
  R1 --> C3
  R1 --> C4
  R1 --> C5

  R2 --> C1
  R2 --> C2
  R2 --> C3
  R2 --> C4

  R3 --> C1
  R3 --> C3

  C1 --> M1
  C2 --> M2
  C3 --> M3
  C4 --> M4
  C5 --> M5
```

## 🛠️ Especificaciones Técnicas

- **Core:** Next.js 16.2.3 (Turbopack), TypeScript 5.x, React 19.
- **Base de Datos:** Dexie.js (IndexedDB) v4.4 con arquitectura versionada.
- **Estética:** Industrial High-Fidelity (Aseptic Retro-Minimalist), Vanilla CSS, Google Fonts (Outfit/Roboto Mono).
- **Cumplimiento:** Aseptic Standard v6.0 (Zero-Knowledge, Local-Only, PBKDF2, UUID Compatibility).

## 📦 Despliegue y Ejecución

1. **Instalación:** `npm install`
2. **Entorno de Desarrollo:** `npm run dev`
3. **Producción/Build:** `npm run build` (Optimizado para Vercel CI/CD).

---

**© 2026 ABD INDUSTRIAL INFRASTRUCTURES** | *Privacidad por Diseño. Blindaje por Arquitectura. Portabilidad por Era.*
