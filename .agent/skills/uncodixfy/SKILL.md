---
name: uncodixfy
description: Enforces clean, industrial, human-designed aesthetics (Aseptic Retro-Minimalist) instead of generic AI-generated UI patterns. Use when generating any frontend code for ABDFN Unified Suite.
---

# Uncodixy UI Standard (Aseptic v6.1 Edition)

Este skill enseña a actuar de la forma más "no-Codex" posible al construir interfaces para **ABDFN Unified Suite**. El "Codex UI" (gradientes, esquinas gigantes, paneles flotantes) está TERMINANTEMENTE PROHIBIDO.

## Cuándo usar este skill
- Cuando se genere código HTML, CSS o React para la suite.
- Cuando se busque la excelencia en la estética **Retro-Industrial**.
- Cuando sea necesario romper el patrón visual de "esto lo ha hecho una IA genérica".

## Workflow
1. **Identificar Patrones Prohibidos**: Eliminar gradientes, transparencias suaves y bordes redondeados excesivos.
2. **Aplicar Estándar Aseptic**: Usar rejillas técnicas, bordes sólidos (1px) y tipografía de datos.
3. **Seleccionar Paleta Industrial**: Usar los tokens definidos en el proyecto.
4. **Validación**: ¿Se siente como una estación de trabajo industrial de 1984 con tecnología moderna?

## Instrucciones

### 1. Keep It Aseptic (Standard)
- **Sidebars**: 220-250px, fondo sólido, bordes de 1px, iconos de `Icons` centralizado.
- **Headers**: Títulos en MAYÚSCULAS DE BLOQUE, jerarquía clara, sin decoraciones innecesarias.
- **Botones**: Radios de 0px a 4px máx (bordes cuadrados preferidos), rellenos sólidos o outlines técnicos.
- **Paneles**: Bordes definidos (`border: 1px solid var(--border-color)`), sin sombras dramáticas.
- **Tipografía**: Fuentes monoespaciadas para datos y IDs, sans-serif técnica para interfaz.
- **Espaciado**: Basado en rejilla técnica (8px, 16px, 24px).

### 2. Hard No (Prohibido)
- NO a las esquinas redondeadas > 4px.
- NO a los gradientes decorativos.
- NO al glassmorphism o paneles con blur de fondo suave.
- NO a las animaciones de rebote (bounce). Solo transiciones lineales o escalonadas.
- NO a las sombras de colores o muy difusas.

### 3. Paletas Industriales (Referencia Era 6.1)

| Theme | Background | Surface | Accent | Border |
|--------|-----------|--------|--------|----------|
| **1984 PC** | `#000000` | `#111111` | `#00ff00` | `#333333` |
| **C64 Industrial** | `#3b3b3b` | `#4a4a4a` | `#8b8b8b` | `#222222` |
| **Monochrome High** | `#ffffff` | `#f0f0f0` | `#000000` | `#cccccc` |

## Output (formato exacto)
Código Vanilla CSS y React limpio, semántico, modular y siguiendo estrictamente la estética industrial de la suite.
