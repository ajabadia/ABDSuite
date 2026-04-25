---
name: 02-code-quality-architecture
description: Auditoría y estándares de código para ABDFN Unified Suite (SOLID, Zod, State Management & Retro UI Architecture).
---

# Code Quality & Architecture - ABDFN Unified Suite (ERA 6.1)

## Propósito
Asegura que la suite mantenga un diseño modular basado en "Shell & Modules", garantizando la integridad estética retro-industrial y una lógica de procesamiento offline-first impecable en todos sus centros de trabajo.

## Capacidades Integradas

### 1. Auditoría Estructural (Logic Auditor)
- **Zero-Backend Mandate**: Toda la lógica de negocio y procesamiento de datos debe residir exclusivamente en el cliente. Prohibido el uso de API Routes para lógica core.
- **Client-Side Validation**: Operaciones con `FileBuffers` y claves maestras validadas mediante Zod schemas.
- **Mandato 100% Inglés**: Identificadores, llaves y comentarios técnicos exclusivamente en inglés.
- **Filosofía DRY**: Reutilizar utilidades globales y componentes compartidos de `src/components/common/`.

### 2. Gestión de Estados (Batch Processing Architecture)
- **State Integrity**: Patrones para gestionar colas masivas sin degradar el rendimiento del navegador.
- **Buffer Hygiene**: Limpieza obligatoria de memoria tras procesar archivos grandes.

### 3. Estética & Mantenibilidad (Aseptic Retro-Minimalist)
- **Aseptic v6.1 Standards**: Seguir la guía visual de Era 6.1. Ensamblaje de piezas industriales definidas en `src/styles/`.
- **Zero-Redundancy CSS Rule**: Prohibido el uso de estilos locales que repliquen funcionalidades de `tokens.css` o `base.css`.
- **Vanilla CSS Enforcement**: Uso de variables CSS para colores, fuentes y espaciados industriales.
- **Icon Centralization**: Importación exclusiva desde `@/components/common/Icons`.

## Workflow de Ejecución
1. **Identificar Tipología**: Hook, Componente UI Industrial o Utilidad de Buffer.
2. **Consultar Style Guide**: Revisar estándares de Era 6.1 antes de añadir clases CSS.
3. **Aplicar Checklist**: SOLID check, Aseptic-CSS sync, Memory Safety.
4. **Reportar**: Resumen de fidelidad visual y cumplimiento del estándar industrial.
