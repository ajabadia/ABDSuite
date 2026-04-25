---
trigger: always_on
---

## 🎯 OBJETIVO

Este documento es el punto de entrada a la gobernanza de **ABDFN Unified Suite**. Define el contexto y el mapa de reglas modulares para la Era 6.1.

---

## 📋 INSTRUCCIONES DE SISTEMA

### CONTEXTO DEL PROYECTO

**Proyecto:** Suite industrial modular para procesamiento aséptico de datos, blindaje criptográfico y generación de documentos (Offline-First).

**Stack Tecnológico:**
- **Frontend**: Next.js 16 + React 19 + TypeScript strict.
- **Lógica**: Offline-First (Procesamiento íntegro en cliente).
- **Tooling**: Turbopack + NPM.
- **DB**: Dexie.js (IndexedDB) + EncryptedDbAdapter (AES-GCM-256).
- **Criptografía**: WebCrypto API (PBKDF2, AES-GCM).
- **UI**: Vanilla CSS (Aseptic Retro-Minimalist) + Custom Component Architecture.
- **IA**: Gemini API (Análisis y Auditoría).

---

## 🗺️ MAPA DE REGLAS MODULARES

Para una gobernanza detallada, consulta los siguientes módulos en `.agent/rules/`:

1.  **[00-context.md](file:///d:/desarrollos/ABDFNSuite/.agent/rules/00-context.md)**: Visión, Ecosistema, Glosario y Hoja de Ruta (Era 6.1).
2.  **[01-core-code.md](file:///d:/desarrollos/ABDFNSuite/.agent/rules/01-core-code.md)**: Estándares de TypeScript, Dexie Stores, Zod y Gestión de Buffers.
3.  **[02-ui-ux.md](file:///d:/desarrollos/ABDFNSuite/.agent/rules/02-ui-ux.md)**: Estética Industrial, Vanilla CSS, Feedback por Consola y Accesibilidad.
4.  **[03-governance-security.md](file:///d:/desarrollos/ABDFNSuite/.agent/rules/03-governance-security.md)**: Crypt Station, Vault Integrity, PBKDF2 y Protección PII.
5.  **[04-maintenance-regressions.md](file:///d:/desarrollos/ABDFNSuite/.agent/rules/04-maintenance-regressions.md)**: Testing Offline, Portabilidad de Datos (Backups) y ADRs.
6.  **[05-standard-patterns.md](file:///d:/desarrollos/ABDFNSuite/.agent/rules/05-standard-patterns.md)**: Patrones de Servicios, Logging de Eventos y Manejo de Errores.
7.  **[06-vercel-standards.md](file:///d:/desarrollos/ABDFNSuite/.agent/rules/06-vercel-standards.md)**: Optimización Next.js y Performance en Procesamiento Masivo.
8.  **[07-methodology.md](file:///d:/desarrollos/ABDFNSuite/.agent/rules/07-methodology.md)**: Orquestación Industrial, Planificación de Guerrilla y TDD.

---

## 🚫 RED FLAGS GLOBALES (RECHAZO INMEDIATO)

❌ **Uso de Castellano (Spanish)** en nombres de llaves de base de datos, enums o esquemas core. **Mandato Universal Era 6**.
❌ **Uso de `any`** en lógica de procesamiento o esquemas de datos.
❌ **Lógica de negocio en API Routes**. El procesamiento debe ser exclusivamente en el cliente (Offline-First).
❌ **Operaciones DB sin cifrado at-rest** o fuera del adaptador `EncryptedDbAdapter`.
❌ **Hardcoding de estilos o colores**. Uso obligatorio de variables en `tokens.css`.
❌ **Duplicación de Lógica (Anti-DRY)**: Se prohíbe la duplicación de lógica, estilos o componentes. Es obligatorio reutilizar servicios, utilidades y clases globales en todas las capas (Frontend, Lógica, DB, UI).
❌ **Falta de feedback visual** (Toasts o Terminal Log) en acciones críticas de mutación.

---

## 🤖 PROTOCOLO OPERATIVO DEL AGENTE (AGENT OPS)

1.  **Persistencia Alternativa**: Si existen problemas de latencia o errores al escribir artefactos en el sistema de la plataforma (ej. cancelaciones por timeout), el agente debe usar la carpeta `.brain/` en la raíz del proyecto como almacenamiento alternativo para planes, logs y tareas.
2.  **Optimización de Búsqueda**: SE PROHÍBE el uso de la herramienta `grep_search` o búsquedas masivas de texto que puedan bloquear la ejecución. Se debe priorizar el uso de `list_dir` y `view_file` para exploración dirigida.

---

**Vigente**: 23 de abril de 2026  
**Versión**: 6.1 (Industrial Aseptic Standards)