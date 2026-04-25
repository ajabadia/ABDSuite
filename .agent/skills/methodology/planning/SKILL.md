---
name: implementation-planning
description: Descomposición de una especificación técnica en un plan de ejecución detallado con tareas granulares para ABDFN Suite.
version: 2.1
rigor: high
---

# Implementation Planning (Era 6.1)

## 🎯 Objetivo
Crear un mapa de ruta detallado que un agente pueda seguir sin ambigüedad, asegurando commits frecuentes y validación constante bajo los estándares de ABDFN.

## ⚡ Cuándo activar
- Inmediatamente después de aprobar un diseño técnico o `SPEC.md`.
- Antes de empezar a tocar código en cualquier tarea que no sea trivial.

## ⚖️ Leyes de Hierro (Iron Laws)
1. **NADA DE PLACEHOLDERS**: No usar "TBD", "TODO" o "implementar lógica aquí". Las rutas y nombres deben ser finales.
2. **CÓDIGO EXACTO**: Cada tarea compleja debe incluir los snippets de código o comandos precisos si son críticos.
3. **INDIVIDUALIDAD**: Cada tarea debe ser autoportante y verificable mediante un comando o test.

## 🛠️ Workflow

### Fase 1: Mapeo de Archivos e Interfaces
1. Identifica todos los archivos que serán creados o modificados.
2. Define los contratos (Zod schemas, interfaces TS) entre componentes para evitar regresiones.

### Fase 2: Descomposición en Tareas (Bite-sized)
3. Divide el trabajo en bloques granulares (Step-by-Step).
4. Cada tarea debe seguir el patrón: **Test/Validación → Implementación → Verificación → Commit**.

### Fase 3: Documentación del Plan
5. Genera o actualiza el archivo de tareas (`task.md`).
6. Cada entrada debe ser clara:
   - **Files**: Lista de rutas exactas.
   - **Action**: Qué se va a hacer.
   - **Verification**: Cómo confirmamos que funciona (ej: `npm test`, inspección browser).

## 📋 Checklist de Validación Final
- [ ] ¿Están todas las rutas de archivos correctas y existen los directorios?
- [ ] ¿El plan evita placeholders?
- [ ] ¿El plan cubre el 100% de los requerimientos aprobados?

## 📤 Output
Un archivo `task.md` listo para ejecución secuencial.
