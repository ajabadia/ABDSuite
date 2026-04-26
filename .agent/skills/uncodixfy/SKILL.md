---
name: uncodixfy
description: Enforces clean, industrial, human-designed aesthetics (Aseptic Retro-Minimalist) instead of generic AI-generated UI patterns.
version: 2.1 (Industrial Aseptic Edition)
---

# Uncodixy UI Standard: ABDFN Industrial

Este skill garantiza que la interfaz de **ABDFN Unified Suite** se mantenga alejada del "Codex UI" (estética predeterminada de IA: gradientes suaves, esquinas circulares, paneles flotantes). En su lugar, forzamos un diseño humano, técnico y aséptico.

## ⚡ Cuándo activar
- Al generar componentes React, layouts CSS o prototipos visuales para la suite.
- Siempre que el usuario pida una interfaz "limpia", "premium" o "industrial".

## 🛠️ Workflow
1. **Identificar Patrones Prohibidos**: Eliminar gradientes corporativos, esquinas redondeadas gigantes y sombras dramáticas.
2. **Aplicar Estándar Aseptic**: Usar rejillas técnicas (8/16/24px), bordes sólidos de 1px y tipografía monoespaciada para datos.
3. **Validación**: ¿Se siente como una estación de trabajo de alta fidelidad o como una plantilla genérica de Internet?

## ⚖️ Instrucciones de Estilo (Era 6.1)

### 1. Keep It Aseptic (Standard)
- **Bordes**: Radios de 0px a 4px máximo. El minimalismo industrial prefiere el ángulo recto o el radio sutil.
- **Estructura**: Sidebars de 240px fijos, fondos sólidos, bordes de 1px claros. Sin paneles "flotantes".
- **Tipografía**: Jerarquía clara. Títulos en MAYÚSCULAS DE BLOQUE. Monoespaciado para valores técnicos.
- **Botones**: Rellenos sólidos o outlines técnicos. Nada de gradientes.
- **Cards**: Bordes sutiles (`1px solid var(--border-color)`), sombras casi imperceptibles (máx 4px blur).

### 2. Hard No (Prohibido)
- NO a las esquinas redondeadas > 4px (evitar el "efecto burbuja").
- NO a los gradientes decorativos para "fingir" calidad.
- NO al glassmorphism (blurs de fondo) salvo en elementos críticos de sistema (CRT effect).
- NO a las animaciones de rebote (bounce). Solo transiciones lineales o "steps".

### 3. Paletas de Referencia (Aseptic v6.1)
Utilizar los tokens CSS del proyecto, inspirados en estas paletas:
- **Obsidian Industrial**: `#0a0a0a` (BG), `#161616` (Surface), `#00d4aa` (Accent).
- **Slate Tech**: `#0f172a` (BG), `#1e293b` (Surface), `#38bdf8` (Accent).

### 4. Omnichannel Industrial Standard (Responsive)
- **Breakpoints**: 
  - **Mobile**: < 640px (Layout monocolumna, Sidebar oculto/Hamburguesa).
  - **Tablet**: 640px - 1024px (Layout compacto, Sidebar colapsado).
  - **Desktop**: > 1024px (Layout industrial completo).
- **Layouts**: Uso obligatorio de `Flexbox` y `Grid` con unidades relativas (`rem`, `%`, `fr`). Prohibido el uso de anchos fijos en contenedores principales.
- **Interactions**: Áreas de toque mínimas de 44px en dispositivos móviles.
- **Data Tables**: Implementar scroll horizontal aséptico o colapso de columnas no críticas en pantallas pequeñas.

---
**Goal**: Break the AI pattern. Human-grade industrial interface only.
