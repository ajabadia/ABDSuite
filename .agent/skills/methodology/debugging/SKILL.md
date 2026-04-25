---
name: systematic-debugging
description: Proceso científico para identificar, aislar y resolver bugs en ABDFN Suite evitando el "ensayo y error".
version: 2.1
rigor: high
---

# Systematic Debugging (Era 6.1)

## 🎯 Objetivo
Resolver incidencias técnicas mediante la identificación de la causa raíz (Root Cause), garantizando la estabilidad a largo plazo del sistema.

## ⚡ Cuándo activar
- Cuando un test falla de forma inesperada o intermitente.
- Ante reportes de comportamiento erróneo en el flujo de datos (RegTech, Vault, Document Gen).
- Cuando surgen errores de integración entre componentes.

## ⚖️ Leyes de Hierro (Iron Laws)
1. **REPRODUCCIÓN PRIMERO**: Si no puedes reproducir el fallo con un input conocido, no estás listo para arreglarlo.
2. **DATOS, NO OPINIONES**: Usa logs, trazas de la consola de terminal y herramientas de inspección.
3. **AISLAMIENTO**: Cambia solo una variable a la vez durante la investigación.

## 🛠️ Workflow

### Fase 1: Reproducción y Aislamiento
1. Encuentra el input o estado mínimo que dispara el fallo.
2. Crea un test de regresión que capture el bug de forma permanente.
3. Identifica el punto exacto donde el flujo de datos se corrompe (usando `console.log` industriales o debugger).

### Fase 2: Formulación de Hipótesis
4. Define la teoría: "El bug ocurre porque el componente A envía X pero el servicio B espera Y".
5. Verifica la hipótesis mediante pruebas dirigidas.

### Fase 3: Resolución y Prevención
6. Aplica el fix sobre la causa raíz, no sobre el síntoma.
7. Verifica que el test de regresión pase y que no se rompan otros módulos.
8. Si el bug fue complejo, documenta la lección aprendida en un ADR o KI.

## 📋 Checklist de Validación Final
- [ ] ¿He creado un test que capture este bug para siempre?
- [ ] ¿He verificado que el fix no causa efectos secundarios en el cifrado o la persistencia?
- [ ] ¿He analizado si este patrón de error se repite en otras partes de la suite?

## 📤 Output
Fix verificado + Test de regresión + Análisis de causa raíz.
