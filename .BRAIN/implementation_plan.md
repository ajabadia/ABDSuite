# Implementation Plan - Industrial Streaming Auditor

Este plan detalla la transformación del motor de auditoría en una herramienta de grado industrial capaz de procesar archivos masivos con consumo de memoria constante y resaltado visual de errores.

## Proposed Changes

### 🛒 Capa de Lógica y Auditoría
- **[gaweb-auditor.logic.ts](file:///d:/desarrollos/ABDFNSuite/src/lib/logic/gaweb-auditor.logic.ts)**:
    - Añadir metadatos de posicionamiento (`startIndex`, `endIndex`) en las anomalías.
- **[package-auditor.logic.ts](file:///d:/desarrollos/ABDFNSuite/src/lib/logic/package-auditor.logic.ts)**:
    - Sustituir el cálculo de MD5 por una implementación asíncrona y eficiente (Web Crypto).

### ⚙️ Capa de Worker e Infraestructura
- **[gaweb-audit.worker.ts](file:///d:/desarrollos/ABDFNSuite/src/lib/workers/gaweb-audit.worker.ts)**:
    - Optimización del stream reading y buffer de RAM.

### 🖥️ Interfaz de Usuario
- **[AuditStation.tsx](file:///d:/desarrollos/ABDFNSuite/src/components/AuditStation/AuditStation.tsx)**:
    - Implementar el componente **"LineInspector"** que resalta cromáticamente los campos erróneos.
    - Añadir telemetría de rendimiento.
