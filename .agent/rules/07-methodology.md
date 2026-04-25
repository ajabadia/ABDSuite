---
trigger: always_on
---

# 07-methodology.md: Metodología de Desarrollo Industrial

Este módulo define el estándar obligatorio para la ejecución de tareas, asegurando la trazabilidad técnica y la calidad del código mediante un ciclo de vida riguroso.

## ⚖️ LEYES DE HIERRO METODOLÓGICAS

1. **FLUJO SECUENCIAL OBLIGATORIO**: Toda intervención técnica que no sea un hotfix trivial DEBE seguir el orden:
   - **Spec (Brainstorming)**: Definición del "qué" y "cómo" conceptual.
   - **Plan (Planning)**: Descomposición en tareas de 2-5 minutos.
   - **Ejecución (TDD)**: Ciclo Red-Green-Refactor por cada tarea.
   - **Cierre (Walkthrough)**: Verificación y documentación de la entrega.

2. **TEST-DRIVEN EVERYTHING**: No se acepta código de lógica de negocio, validadores o servicios que no cuente con una suite de pruebas que lo valide.

3. **ATOMICIDAD Y TRAZABILIDAD**: Cada cambio debe ser atómico y estar vinculado a una tarea específica del plan aprobado.

## 🛠️ ORQUESTACIÓN DE TAREAS

Para la ejecución de estas reglas, el agente DEBE apoyarse en las skills ubicadas en `.agent/skills/methodology/`:

- **superpowers-orchestrator**: Coordina el paso de una fase a otra.
- **implementation-planning**: Genera el archivo `task.md` con las tareas granulares.
- **brainstorming**: Ayuda a resolver ambigüedades y crear la `SPEC.md`.
- **test-driven-development**: Guía la implementación táctica.
- **systematic-debugging**: Se activa ante fallos inesperados para encontrar la causa raíz.

## 📋 ENTREGABLES OBLIGATORIOS POR TASK

- **SPEC.md** (o actualización de la misma): En la carpeta de la funcionalidad o raíz.
- **task.md**: Lista de tareas con checkboxes de progreso.
- **walkthrough.md**: Resumen final con capturas/grabaciones de validación visual.

---
**Era 6.1** - Rigor Industrial Aseptic
