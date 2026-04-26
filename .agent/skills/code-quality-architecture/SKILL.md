---
name: code-quality-architecture
description: Auditoría y estándares de código para ABDFN Unified Suite (SOLID, Zod, Clean Architecture).
version: 2.1 (Industrial Aseptic Edition)
---

# Code Quality & Architecture: ABDFN Industrial (Era 6.1)

Este skill establece las leyes de calidad para garantizar que el código de la suite sea profesional, mantenible y escalable bajo los principios de **Clean Architecture**.

## ⚡ Cuándo activar
- Al crear nuevos servicios en `src/lib/logic/` o `src/lib/services/`.
- Durante refactorizaciones de componentes complejos o el motor de base de datos.
- Revisiones de código para asegurar el cumplimiento de la Era 6.1.

## ⚖️ Leyes de Hierro (Code Laws)

### 1. Principios SOLID & Clean Code
- **S (Single Responsibility)**: Cada servicio o componente tiene una única razón para cambiar.
- **D (Dependency Inversion)**: Depender de abstracciones (interfaces), no de concreciones.
- **English-Only Mandate**: Toda la lógica interna (variables, funciones, comentarios técnicos) DEBE estar en inglés. **Mandato Universal Era 6**.
- **Atomic Components**: Separación estricta entre lógica de negocio (Hooks/Services) y renderizado (UI).

### 2. Estándares ABDFN (Aseptic v6.1)
- **Zero-Backend Mandate**: Toda la lógica core reside en el cliente. Prohibido procesar datos sensibles en API Routes.
- **Schema Validation**: Forzar validación de inputs/outputs mediante **Zod**.
- **Memory Hygiene**: Gestión eficiente de buffers y limpieza de estados al desmontar componentes masivos.
- **Vanilla CSS Enforcement**: Uso exclusivo de variables CSS y tokens industriales. Prohibido duplicar estilos de `base.css`.

## 🛠️ Workflow de Ejecución
1. **Auditoría Estructural**: Verificar SRP y SOLID en la lógica propuesta.
2. **Schema Check**: Asegurar que los datos están tipados y validados.
3. **i18n Check**: Confirmar que no hay texto hardcoded en la UI (todo via `useLanguage`).
4. **Validation**: ¿El código es legible para un humano y escalable para la Era 7?

---
**Status**: ENFORCED in all jurisdictional and core modules.
