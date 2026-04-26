---
name: react-best-practices
description: Estándares de desarrollo en React y Next.js para aplicaciones de alto rendimiento y mantenibilidad.
version: 1.0 (Industrial Aseptic)
---

# React & Next.js Best Practices: ABDFN Standard

Este skill define los patrones de implementación para componentes y lógica en el entorno Next.js de la suite.

## ⚡ Cuándo activar
- Al desarrollar nuevos componentes de interfaz o hooks personalizados.
- Durante la optimización de rendimiento o resolución de re-renders innecesarios.

## ⚖️ Leyes de Hierro
1. **Server vs Client**: Uso estricto de `'use client'` solo donde sea estrictamente necesario.
2. **Hook Integrity**: Seguir las reglas de oro de los Hooks (no condicionales, no bucles).
3. **Memoization**: Uso juicioso de `useMemo` y `useCallback` en componentes que manejan grandes volúmenes de datos (Tablas Industriales).
4. **Prop Drilling**: Evitarlo usando el sistema de Contextos de la suite (LogContext, AuthContext, etc.).

## 🛠️ Workflow
1. **Identificar Responsabilidad**: ¿Es un componente de presentación o un contenedor de lógica?
2. **Audit de Renders**: Verificar que el componente no se re-renderiza innecesariamente.
3. **Clean Code React**: Descomponer componentes grandes (>150 líneas) en piezas atómicas.

---
**Status**: ACTIVE. Operational Excellence.
