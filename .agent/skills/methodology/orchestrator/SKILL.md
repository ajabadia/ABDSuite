---
name: superpowers-orchestrator
description: La skill maestra que coordina el ciclo de vida completo de un desarrollo en ABDFN Suite, desde la idea inicial hasta la entrega final verificada.
version: 2.1
rigor: high
---

# Superpowers Orchestrator (Master Workflow - Era 6.1)

## 🎯 Objetivo
Guiar al agente a través de las fases correctas de desarrollo para maximizar la calidad, minimizar errores y asegurar que el código cumple con los estándares industriales de ABDFN Suite (Aseptic Retro-Minimalist).

## ⚡ Cuándo activar
- Siempre que el usuario pida una nueva funcionalidad, un refactor complejo o la resolución de un bug arquitectónico.
- Es la skill de entrada por defecto para cualquier "Task" de Antigravity.

## ⚖️ Leyes de Hierro (Iron Laws)
1. **SECUENCIA OBLIGATORIA**: No se puede saltar al código sin una `SPEC.md` (o actualización de la misma) y un `PLAN` previos (salvo en hotfixes triviales).
2. **VERIFICACIÓN CONTINUA**: Cada fase debe cerrarse con una validación del usuario o una checklist interna.
3. **TRAZABILIDAD**: Cada decisión técnica debe estar anclada en la especificación del proyecto.

## 🛠️ Workflow (El Ciclo de Vida)

### Fase 1: Concepción y Diseño
1. Activa la skill de `methodology/brainstorming`.
2. Produce o actualiza la `SPEC.md` o el `implementation_plan.md`.
<HARD-GATE: ¿El usuario ha aprobado la SPEC/Plan?>

### Fase 2: Planificación de Guerrilla
3. Activa la skill de `methodology/planning`.
4. Produce el archivo de tareas (`task.md`).
<HARD-GATE: ¿El plan cubre todos los puntos de la SPEC?>

### Fase 3: Ejecución de Élite (TDD)
5. Por cada tarea del plan:
   - Aplica la skill de `methodology/tdd`.
   - Realiza commits atómicos siguiendo el estándar de la Era 6.
   - Si surge un bug inesperado, activa `methodology/debugging`.

### Fase 4: Cierre y Verificación
6. Ejecuta la suite completa de tests y validaciones industriales.
7. Presenta el `walkthrough.md` al usuario incluyendo evidencias visuales (screenshots/recordings).

## 📋 Checklist de Validación Final
- [ ] ¿Se ha seguido el orden: Spec -> Plan -> Code?
- [ ] ¿Se han respetado las Leyes de Hierro de cada sub-skill?
- [ ] ¿El resultado final es 100% funcional y cumple con la estética Aseptic Retro-Minimalist?

## 📤 Output
Un proyecto terminado, documentado y verificado bajo estándares industriales.
