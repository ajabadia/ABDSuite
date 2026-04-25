---
name: test-driven-development
description: Ciclo Red-Green-Refactor para asegurar la calidad y testabilidad del código en ABDFN Suite.
version: 2.1
rigor: high
---

# Test-Driven Development (TDD - Era 6.1)

## 🎯 Objetivo
Garantizar que cada línea de código de producción en la suite esté justificada por un test y sea verificable de forma automática, manteniendo la integridad del sistema.

## ⚡ Cuándo activar
- Siempre que se escriba lógica de negocio, validadores RegTech o servicios core.
- Durante la fase de ejecución de un plan de implementación.

## ⚖️ Leyes de Hierro (Iron Laws)
1. **NO TESTS, NO CODE**: No se escribe código de producción sin un test que falle primero (o una validación técnica equivalente en UI).
2. **MINIMALISMO (YAGNI)**: Solo escribe el código necesario para pasar el test. Evita sobre-ingeniería.
3. **FAIL FIRST**: Debes ver el test fallar antes de implementar la solución.

## 🛠️ Workflow

### Fase 1: RED (Fallo Controlado)
1. Escribe el test unitario o de integración más pequeño posible.
2. Ejecuta el test. Debe fallar con un error conocido (ej. `TypeError` o `AssertionError`).

### Fase 2: GREEN (Funcionalidad Mínima)
3. Escribe el código mínimo para que el test pase. En esta fase, la funcionalidad manda sobre la elegancia.
4. Ejecuta el test. Debe dar verde.

### Fase 3: REFACTOR (Excelencia Industrial)
5. Limpia el código siguiendo los estándares de `code-quality-architecture` y las reglas de TypeScript strict.
6. Asegura que el código respeta la estética **Aseptic Retro-Minimalist**.
7. Realiza un commit atómico describiendo el cambio.

## 📋 Checklist de Validación Final
- [ ] ¿He visto fallar el test antes de que pasara?
- [ ] ¿El código implementado es el mínimo necesario para cumplir la tarea?
- [ ] ¿Se han ejecutado los tests para prevenir regresiones en otros módulos?

## 📤 Output
Código verificado, testeado y commits atómicos.
