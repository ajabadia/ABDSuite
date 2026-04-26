---
name: superpowers-orchestrator
description: La skill maestra que coordina el ciclo de vida completo de un desarrollo en ABDFN Suite, desde la idea inicial hasta la entrega final verificada.
version: 2.1 (Industrial Aseptic Edition)
rigor: high
---

# Superpowers Orchestrator: ABDFN Industrial Edition

## 🎯 Objetivo
Guiar el desarrollo en ABDFN Suite a través de fases estancas para maximizar la calidad, garantizar el blindaje criptográfico y asegurar el cumplimiento de la Era 6.1.

## ⚡ Cuándo activar
- Intervenciones en el motor RegTech, ETL, Crypt o Letter Station.
- Refactorizaciones de servicios core o middleware de base de datos.
- Es el punto de entrada obligatorio para cualquier "Task" no trivial.

## ⚖️ Leyes de Hierro (Iron Laws)
1. **SECUENCIA OBLIGATORIA**: Spec (Brainstorming) -> Plan (Planning) -> Code (TDD). Prohibido el código directo.
2. **ZERO-PII LEAK**: Durante el diseño (Spec), validar que ningún dato sensible escape a almacenes no cifrados.
3. **TRAZABILIDAD**: Cada cambio debe estar anclado a un ítem del `task.md` y documentado en la `SPEC.md`.

## 🛠️ Workflow (Ciclo de Vida ABDFN)

### Fase 1: Concepción y Diseño (Aseptic Spec)
1. Activa `brainstorming` skill.
2. Produce/Actualiza `SPEC.md` en la raíz o carpeta de funcionalidad.
3. **Check**: ¿Cumple con los estándares de seguridad de la Era 6.1?
<HARD-GATE: ¿El usuario ha aprobado la SPEC?>

### Fase 2: Planificación de Guerrilla (Industrial Planning)
4. Activa `implementation-planning` skill.
5. Genera `task.md` con tareas atómicas de 2-5 min.
<HARD-GATE: ¿El plan cubre todas las aristas de seguridad y UI?>

### Fase 3: Ejecución de Élite (TDD & Clean Code)
6. Por cada tarea en `task.md`:
   - Aplica `test-driven-development` (Ciclo Red-Green-Refactor).
   - Seguir `uncodixfy` para la UI y `code-quality-architecture` para la lógica (SOLID).
   - Si surge un bug, activar `systematic-debugging`.

### Fase 4: Cierre y Verificación (SYS_READY)
7. Ejecutar suite de pruebas (tsc, unit tests, offline checks).
8. Presentar `walkthrough.md` con evidencias de cumplimiento.

## 📋 Checklist de Validación Final
- [ ] ¿Código 100% en inglés (lógica interna)?
- [ ] ¿Zero console.log en producción?
- [ ] ¿Validación Zod en todas las entradas de datos?
- [ ] ¿Integridad de auditoría en AuditService confirmada?

---
**Vigente**: Era 6.1 - Industrial Standards
