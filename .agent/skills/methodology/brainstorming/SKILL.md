---
name: brainstorming
description: Proceso Socrático para refinar ideas y definir especificaciones técnicas (SPEC.md) en el ecosistema ABDFN Suite.
version: 2.1
rigor: high
---

# Brainstorming & Specification (Era 6.1)

## 🎯 Objetivo
Transformar un requerimiento o idea en una especificación técnica sólida, explorando alternativas y validando el diseño con el usuario antes de la ejecución.

## ⚡ Cuándo activar
- Al inicio de cualquier funcionalidad significativa.
- Antes de realizar refactors arquitectónicos.
- Cuando la petición del usuario sea ambigua o compleja.

## ⚖️ Leyes de Hierro (Iron Laws)
1. **PROHIBIDO** escribir código de producción durante esta fase.
2. **OBLIGATORIO** proponer alternativas si la solución inicial presenta riesgos de mantenibilidad.
3. **NO ASUMIR**: Usar el método socrático para preguntar al usuario sobre casos de borde.

## 🛠️ Workflow

### Fase 1: Entendimiento Socrático
1. Realiza preguntas aclaratorias sobre el flujo de datos y la experiencia de usuario esperada.
2. Identifica los criterios de éxito técnicos e industriales (cumplimiento de `rules.md`).
<HARD-GATE: ¿El usuario ha confirmado que el enfoque resuelve su problema?>

### Fase 2: Exploración y Diseño Aseptic
3. Propón el enfoque técnico. Evalúa si respeta el principio **Offline-First** y el cifrado **AES-GCM-256** si aplica.
4. Define el **Scope**: Qué se va a construir y qué NO se va a tocar.
5. Identifica riesgos (rendimiento, seguridad PII, regresiones).

### Fase 3: Documentación (SPEC/Plan)
6. Genera un archivo de especificación o actualiza el `implementation_plan.md` con:
   - **Contexto**: Problema a resolver.
   - **Arquitectura**: Componentes afectados y nuevos esquemas de datos.
   - **Seguridad**: Cómo se protegen los datos si es necesario.

## 📋 Checklist de Validación Final
- [ ] ¿He explorado alternativas en lugar de ir a la solución más obvia?
- [ ] ¿He definido los límites del proyecto (Scope)?
- [ ] ¿El diseño cumple con los estándares industriales de la Era 6.1?

## 📤 Output
Documentación técnica aprobada por el usuario.
