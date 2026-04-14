---
name: 02-code-quality-architecture
description: Auditoría y estándares de código para ABDFN Unified Suite (SOLID, Zod, State Management & Retro UI Architecture).
---

# Code Quality & Architecture - ABDFN Unified Suite (ERA 5)

## Propósito
Asegura que la suite mantenga un diseño modular basado en "Shell & Modules", garantizando la integridad estética retro-industrial y una lógica de procesamiento offline-first impecable en todos sus centros de trabajo.

## Capacidades Integradas

### 1. Auditoría Estructural (Logic Auditor)
- **Zero-Backend Mandate**: Valida que toda la lógica resida exclusivamente en el cliente. Prohibido el uso de API Routes para procesamiento de datos.
- **Client-Side Validation**: Asegura que las operaciones con `FileBuffers` y claves maestras estén validadas mediante Schemas (Zod o validación tipada estricta).
- **Mandato 100% Inglés**: Verifica que NO existan identificadores, llaves o comentarios en castellano en la lógica interna (excepto en el diccionario de traducciones).
- **Filosofía DRY (Don't Repeat Yourself)**: Es OBLIGATORIO reutilizar las utilidades globales de layout (`.module-grid`, `.module-col-*`) y componentes compartidos. Se prohíbe la duplicación de estilos estructurales entre estaciones de trabajo (módulos).

### 2. Gestión de Estados (Batch Processing Architecture)
- **State Integrity**: Implementa patrones para gestionar colas de archivos masivos sin degradar el rendimiento del navegador.
- **Buffer Hygiene**: Asegura la limpieza de memoria tras procesar archivos grandes para evitar fugas de memoria en sesiones largas.

### 3. Estética & Mantenibilidad (Retro Identity)
- **Retro-UI Audit**: Valida que los nuevos componentes respeten la paleta de colores CGA/pixelada y el uso de bloques visuales approved.
- **Atomic Components**: Un componente, una responsabilidad (SOLID). Separación estricta entre la lógica de cifrado y el renderizado retro.

## Workflow de Ejecución
1. **Identificar Tipología**: Hook de Criptografía, Componente UI, o Utilidad de Buffer.
2. **Aplicar Checklist**: SOLID check, Retro-CSS sync, Memory Safety.
3. **Reportar**: Resumen de cumplimiento y fidelidad visual al tema original.
