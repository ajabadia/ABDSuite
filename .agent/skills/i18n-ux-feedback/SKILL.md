---
name: i18n-ux-feedback
description: Internacionalización retro-minimalista, accesibilidad global y sistema de feedback por consola.
version: 2.1 (Industrial Quad-Sync Edition)
---

# i18n & UX Feedback: ABDFN Industrial

Este skill garantiza que la suite sea inclusiva y técnica, manteniendo una respuesta visual coherente con la estética retro-minimalista y un sistema de feedback forense detallado.

## ⚡ Cuándo activar
- Al crear nuevas interfaces de usuario o modificar el flujo de interacción.
- Durante la integración de nuevos idiomas o la corrección de textos.
- Al implementar sistemas de progreso para tareas masivas (Batch).

## ⚖️ Leyes de Hierro (UX Laws)

### 1. Internacionalización (Quad-Sync)
- **Zero Hardcoded Strings**: Prohibido el texto en plano en los componentes. Todo debe residir en `src/locales/`.
- **Language Parity**: Cualquier nueva funcionalidad debe tener traducciones para **ES, EN, FR y DE**.
- **Contextual i18n**: Uso correcto de plurales y variables dinámicas en las traducciones.

### 2. Feedback Forense (Industrial Feedback)
- **LogConsole First**: Las operaciones técnicas deben emitir logs detallados (Info, Warning, Error) a la consola interna.
- **Visual Heartbeat**: Mostrar indicadores de carga o progreso claros en procesos de larga duración (>2s).
- **Industrial Colors**: Verde (Success), Ámbar (Warning), Rojo (Critical), Azul (Info/System).

### 3. Accesibilidad Industrial (A11y)
- **Keyboard-First**: Operabilidad total mediante teclado en wizards y tablas.
- **High Contrast**: Garantizar legibilidad en temas oscuros industriales (Obsidian/Slate).
- **ARIA Semantics**: Uso de roles semánticos correctos para lectores de pantalla.

## 🛠️ Workflow de UX
1. **i18n Audit**: Verificar cumplimiento Quad-Sync y ausencia de hardcoding.
2. **Feedback Check**: Asegurar que las acciones críticas tienen feedback sonoro/visual y de consola.
3. **Fidelidad Aseptic**: Validar que el componente cumple con `uncodixfy`.

---
**Status**: ACTIVE. Global Industrial Reach.
