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

### 3. Estética & Mantenibilidad (Design System & Modular CSS)
- **Aseptic v4 Standards**: Es OBLIGATORIO seguir la [Guía de Referencia Técnica Aseptic v4](file:///d:/desarrollos/ABDFNSuite/DOCS/ASEPTIC_V4_STYLE_GUIDE.md). El desarrollo debe basarse en el ensamblaje de piezas industriales ya definidas en `src/styles/`.
- **Zero-Redundancy CSS Rule**: Se PROHÍBE terminantemente el uso de estilos locales (`.module.css`) o `inline` que repliquen funcionalidades ya existentes en los componentes globales industriales.
- **Design Tokens Enforcement**: Solo se permite el uso de variables CSS definidas en `tokens.css`. El hardcoding de colores o fuentes está estrictamente prohibido.
- **Icon Centralization Mandate**: Todos los iconos deben importarse exclusivamente desde `@/components/common/Icons`. Se prohíben iconos específicos de aplicación o locales.
- **Visual Audit Hygiene**: Los elementos marcados con bordes neón (Magenta/Cian) por `legacy-audit.css` deben ser refactorizados prioritariamente durante cualquier intervención en el módulo afectado.

## Workflow de Ejecución
1. **Identificar Tipología**: Hook de Criptografía, Componente UI Industrial, o Utilidad de Buffer.
2. **Consultar Style Guide**: Revisar `ASEPTIC_V4_STYLE_GUIDE.md` antes de añadir cualquier nueva clase CSS.
3. **Aplicar Checklist**: SOLID check, Aseptic-CSS sync, Memory Safety.
4. **Reportar**: Resumen de cumplimiento y fidelidad visual al estándar industrial de la suite.
