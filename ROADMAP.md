# 🗺️ ROADMAP: ABDFN Unified Web Suite (ERA 5)

Este documento sirve como registro maestro y guía de ejecución para la transformación del **ABDFN Encryptor** en una **Suite Web Multiactividad de Alto Rendimiento**.

## 1. Visión del Proyecto
Centralizar todas las utilidades de `ABDFiles` (C#) en una plataforma web única, **100% Offline (Zero-Knowledge)**, manteniendo la estética retro-terminal y mejorando la integración entre herramientas.

- **Directorio de Trabajo:** `D:\desarrollos\ABDFNSuite`
- **Base Técnica:** Next.js 15, TypeScript, Vanilla CSS, i18n (4 idiomas), Arquitectura de Shell & Modules.
- **Estado Global:** Phase A finalizada. Infraestructura base operativa.

## 3. Arquitectura del Sistema (Modular)
La aplicación evolucionará a un diseño de **"Shell & Modules"**:
- **Sidebar de Navegación:** Acceso instantáneo a los diferentes centros de trabajo.
- **Módulos:**
  - `CRYPT_STATION`: Encriptación AES-GCM (Migrado de v4.0).
  - `ETL_STUDIO`: Dividido en **DESIGNER** (Creación de Presets) y **RUNNER** (Procesado masivo).
  - `LETTER_STATION`: Mapeador de datos y generación masiva de documentos.
  - `SYSTEM_AUDIT`: Verificación de paquetes y herramientas de integridad.

## 4. Próximos Pasos de Ejecución

### Fase A: El Contenedor Global (The Shell) [CONCLUIDO ✅]
1.  **Refactorización de Layout:** Creado el componente `Sidebar` retro-colapsable y un `TopBar` con gestión i18n/Theme.
2.  **Dashboard Hub:** Implementada terminal de inicio con monitor de sistema simulado y arte ASCII.

### Fase B: ETL Studio (Designer & Runner) [EN PROGRESO 🚧]
1.  **ETL Designer [COMPLETADO ✅]**: 
    - Arquitectura "Read-Only + Modal Edit" para Presets y Record Types.
    - Detección visual de colisiones y huecos en campos.
    - Gestión avanzada de campos (Numeric Sort, ID-based tracking).
    - Refinamiento Estético: Layout lateral simétrico, prompt terminal en TopBar, iconografía industrial estandarizada.
2.  **ETL Runner [PENDIENTE]**: Implementación de procesamiento paralelo mediante Web Workers para archivos de GBs.

### Fase C: Letter Station [PENDIENTE]
1.  **Mapping Engine:** Interfaz interactiva para arrastrar campos de datos a variables de plantilla.
2.  **Generation Engine:** Implementación de generación PDF local basada en HTML o DOCX.

## 5. Instrucciones para Continuar
Si se pierde el contexto de la sesión, el agente deberá:
1.  Leer este `ROADMAP.md`.
2.  Leer las Skills en `.agent/skills/`.
3.  Iniciar con la **Fase B.2: Implementación del ETL Runner**.

---
**© 2026 ABD-IA Systems** | *Excelencia en Procesamiento Local.*
