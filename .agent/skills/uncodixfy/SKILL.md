---
name: uncodixfy
description: Enforces clean, human-designed aesthetics (inspired by Linear, Stripe, GitHub) instead of generic AI-generated UI patterns. Use when generating any frontend code.
---

# Uncodixy UI Standard

Este skill enseña a actuar de la forma más "no-Codex" posible al construir interfaces. El "Codex UI" es la estética predeterminada de la IA: gradientes suaves, paneles flotantes, esquinas excesivamente redondeadas y layouts genéricos.

## Cuándo usar este skill
- Cuando se genere código HTML, CSS, React, Vue o Svelte.
- Cuando el usuario pida una interfaz con estética "premium" o "limpia".
- Cuando se necesite romper el patrón visual de "esto lo ha hecho una IA".

## Inputs necesarios
- Tipo de componente a desarrollar (Sidebar, Button, Table, etc.)
- Contexto de la aplicación (Dashboard, Landing, App interna).

## Workflow
1. **Identificar Patrones Prohibidos**: Revisar la sección "Hard No" para evitar vicios comunes de IA.
2. **Aplicar Estándar Normal**: Usar las especificaciones de la sección "Keep It Normal".
3. **Seleccionar Paleta**: Usar una paleta de colores predefinida de las tablas de referencia.
4. **Validación**: Asegurarse de que el resultado se parezca a Linear, Stripe o GitHub.

## Instrucciones

### 1. Keep It Normal (Estandard)
- **Sidebars**: 240-260px fijos, fondo sólido, borde derecho simple, sin paneles flotantes.
- **Headers**: h1/h2 con jerarquía clara, sin etiquetas "eyebrow" en mayúsculas.
- **Botones**: Radios de 8-10px máx, rellenos sólidos o bordes simples, sin gradientes.
- **Cards**: Radios de 8-12px máx, bordes sutiles, sombras suaves (máx 8px blur).
- **Tipografía**: Fuentes de sistema o sans-serif simples, tamaños 14-16px para cuerpo.
- **Espaciado**: Escala consistente (4/8/12/16/24/32px).

### 2. Hard No (Prohibido)
- NO a las esquinas redondeadas gigantes (>20px).
- NO a los gradientes corporativos suaves para "fingir" calidad.
- NO a los paneles de cristal (glassmorphism) flotantes por defecto.
- NO a las animaciones "bouncy" o transformaciones exageradas en hover.
- NO a las sombras dramáticas o con colores.

### 3. Paletas de Colores (Referencia)

#### Dark Mode
| Palette | Background | Surface | Primary | Secondary |
|--------|-----------|--------|--------|----------|
| Obsidian Depth | `#0f0f0f` | `#1a1a1a` | `#00d4aa` | `#00a3cc` |
| Slate Noir | `#0f172a` | `#1e293b` | `#38bdf8` | `#818cf8` |
| Void Space | `#0d1117` | `#161b22` | `#58a6ff` | `#79c0ff` |

#### Light Mode
| Palette | Background | Surface | Primary | Secondary |
|--------|-----------|--------|--------|----------|
| Cloud Canvas | `#fafafa` | `#ffffff` | `#2563eb` | `#7c3aed` |
| Porcelain Clean | `#f9fafb` | `#ffffff` | `#4f46e5` | `#8b5cf6` |

## Output (formato exacto)
Código frontend limpio, semántico y siguiendo estrictamente las restricciones visuales mencionadas.
