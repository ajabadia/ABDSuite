# ⚔️ ABDFN Unified Suite (v4.1-INDUSTRIAL)

**Excelencia en Procesamiento Local Aséptico & Paridad Bancaria GAWEB v.1.**

ABDFN Unified Suite es una plataforma modular de grado industrial diseñada para operaciones críticas de datos mediante tecnología **Offline-First**. Optimizada para el cumplimiento del estándar **Aseptic v4.1**, garantiza que el procesamiento masivo de documentos y el blindaje criptográfico ocurran íntegramente en el cliente.

## 🏛️ El Ecosistema Modular (The Shell)

La suite organiza las operativas en estaciones de trabajo especializadas, guiadas por un **Wizard Progresivo Dinámico**:

- **🔐 CRYPT STATION:** Suite criptográfica AES-256-GCM.
  - **Shield Vault:** Blindaje masivo con derivados de PBKDF2.
  - **Open Key:** Descifrado seguro y validación de firma.
- **📊 ETL STUDIO:** Motor de transformación estructural.
  - **Designer:** Modelado visual de registros y segregación técnica.
  - **Executor:** Procesamiento de grandes volúmenes con persistencia IndexDB.
- **📄 LETTER STATION (Industrial Ready):** Motor de generación de documentos con paridad total **GAWEB v.1**.
  - **Single Source of Truth:** Sincronización absoluta de offsets (300 bytes) entre generación y auditoría.
  - **Native Persistence:** Integración con la *Native File System API* para guardado directo en carpetas y diálogos de sistema de Chrome.
- **🛡️ SYSTEM AUDIT:** Auditoría técnica y validación de paridad.
  - **GAWEB Auditor:** Validador en tiempo real de archivos `.txt` contra el manual oficial de diseño v.1.

## 🚀 Innovaciones Aseptic v4.1

- **⚡ Motor Agnóstico Inyectado:** El generador recibe las reglas de negocio en tiempo real, asegurando 0% de discrepancia entre los archivos generados y los auditados.
- **🛠️ Wizard Industrial Progresivo:** Interfaz en cascada que guía al operador, bloqueando acciones críticas hasta que se satisfacen todos los requisitos de datos.
- **📂 Chrome File Access:** Soporte completo para `showSaveFilePicker`, permitiendo el guardado manual de backups JSON y paquetes ZIP cumpliendo con las políticas de seguridad de Windows.
- **⚛️ Arquitectura de Latido (Heartbeat):** Monitoreo constante del estado de los Workers de fondo para asegurar la integridad de procesos largos.

## 🛠️ Especificaciones Técnicas

- **Core:** Next.js 16.2.3 (Turbopack), TypeScript 5.x.
- **Base de Datos:** Dexie.js (IndexedDB) con persistencia reactiva.
- **Estética:** Industrial High-Fidelity (Retro-Minimalist), Vanilla CSS, Google Fonts (Outfit/Roboto Mono).
- **Cumplimiento:** Aseptic Standard v4.1 (Zero-Knowledge, Local-Only).

## 📦 Despliegue y Ejecución

1. **Instalación:** `npm install`
2. **Entorno de Desarrollo:** `npm run dev`
3. **Producción/Build:** `npm run build` (Optimizado para Vercel CI/CD).
4. **Acceso Local:** `http://localhost:4100`

---

**© 2026 ABD INDUSTRIAL INFRASTRUCTURES** | *Privacidad por Diseño. Potencia por Arquitectura.*
