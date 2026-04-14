---
name: 06-i18n-ux-feedback
description: Internacionalización retro-minimalista, accesibilidad global y sistema de feedback por consola de terminal.
---

# i18n & UX Feedback - ABDFN Unified Suite (ERA 5)

## Propósito
Garantiza que la suite sea inclusiva y accesible para una audiencia global (ES/EN/FR/DE) manteniendo una respuesta visual coherente con un terminal de comandos clásico y una navegación fluida entre módulos.

## Capacidades Integradas

### 1. Internacionalización (i18n Retro-Style)
- **Centralized Dictionary**: Asegura que todos los textos pasen por `useLanguage` y residan en `src/lib/i18n/translations.ts`.
- **Uppercase Mandate**: Por razones estéticas retro, los textos críticos de acción y títulos deben presentarse en MAYÚSCULAS DE BLOQUE.
- **Region Switching**: Implementa transiciones de idioma instantáneas sin recarga de página, respetando el estado persistente.

### 2. Feedback por Consola (Log-First UX)
- **Terminal Logs**: Sustituye las notificaciones modernas (toasts) por la consola de operaciones integrada (`LogConsole`).
- **Batch Visibility**: Obligatorio mostrar el progreso detallado (éxito, fallo, salto) de cada procesamiento de archivo en la consola.
- **Status Indicators**: Uso de colores codificados (verde para éxito, rojo para error, ámbar para advertencia) dentro del flujo de texto.

### 3. Accesibilidad de Navegador (a11y Auditor)
- **Screen Reader Support**: Valida que los iconos decorativos usen `aria-hidden="true"` y los botones de acción tengan etiquetas descriptivas dinámicas en el idioma seleccionado.
- **Keyboard Navigation**: Asegura que el usuario pueda completar todo el ciclo de encriptación (selección, contraseña, procesar) usando exclusivamente el teclado.
- **Contrast Compliance**: Garantiza que los temas (1984 PC y Commodore 64) cumplan con los mínimos de contraste WCAG AA.

## Workflow de UX
1. **Auditar Traducción**: Validar que no queden textos literales fuera del diccionario.
2. **Revisar Log**: ¿La acción genera una entrada legible en la consola retro?
3. **Validar Navegación**: Comprobar el orden de tabulación en la vista de escritorio y móvil.
4. **Respuesta Visual**: Asegurar efectos de hover y foco con la estética de bloques aprobada.
