# Sanctuary of Lessons Learned — `@ajabadia/styles`

This document stores the technical challenges, silent failures, and resolution strategies discovered during the development of the `@ajabadia/styles` unified dynamic styling system.

---

## 🏛️ Victory 1: CommonJS Mismatch under strict `verbatimModuleSyntax`

### 1. The Symptom
During the first execution of `npm run build` (`tsc`), the compiler threw 12 syntax-related errors across all source files, including:
*   `src/engine/css-generator.ts:1:10 - error TS1295: ECMAScript imports and value declarations in a CommonJS module when 'verbatimModuleSyntax' is enabled.`
*   `src/utils/color-utils.ts:66:1 - error TS1287: A top-level 'export' modifier cannot be used in a CommonJS module.`

### 2. The Root Cause
Our TSConfig was strictly configured for modern environments:
```json
"compilerOptions": {
  "module": "NodeNext",
  "moduleResolution": "NodeNext",
  "verbatimModuleSyntax": true
}
```
However, in Node, if `"type": "module"` is **not** specified in the local `package.json`, the environment defaults to **CommonJS**. Under `NodeNext` resolution rules:
*   TypeScript treats `.ts` files as CommonJS targets if they are in a CommonJS package directory.
*   But when `"verbatimModuleSyntax": true` is active, the compiler enforces strict consistency. It forbids using standard ES module keywords (`import` and `export`) inside any file that compiles to CommonJS!
*   Therefore, the modern import/export statements in our source code were flagged as illegal, triggering compiler failures.

### 3. The Industrial Solution
We updated [package.json](file:///d:/desarrollos/ABDStyles/package.json) to explicitly include:
```json
"type": "module"
```
This single setting instructs both Node and TypeScript that this package consists entirely of modern ECMAScript Modules (ESM). The compiler immediately matched our ES import/export code with ESM compilation targets under `NodeNext` and compiled the whole library with **0 errors and 0 warnings**.

---

## 🏛️ Victory 2: Abstracción de Componentes de UI y Conflictos de Dependencias de React 19

### 1. El Síntoma
Al añadir componentes interactivos como `AdminPageHeader.tsx`, `Footer.tsx`, `HeroHeader.tsx`, `TacticalSidebar.tsx` y `ThemeScript.tsx` a la librería `@ajabadia/styles`, surgieron dos problemas:
1. El compilador `tsc` fallaba al no saber cómo interpretar las etiquetas JSX (`<button>`, `<aside>`, etc.), arrojando errores de sintaxis TS.
2. Al ejecutar `npm install` localmente para verificar los tipos de React, la herramienta de administración de paquetes de Node (`npm`) arrojó un error de árbol de dependencias (`ERESOLVE` unable to resolve dependency tree) indicando que `lucide-react@0.46.0` requiere de forma estricta React 16, 17 o 18, colisionando con el nuevo `react@^19.0.0` declarado en la raíz.

### 2. La Causa Raíz
*   Por defecto, la configuración de TypeScript (`tsconfig.json`) en proyectos puros de TS no tiene habilitada la directiva JSX, impidiendo la compilación de archivos `.tsx`.
*   El ecosistema de paquetes de React experimenta desajustes de versiones de pares (peer dependencies) debido a la transición hacia React 19. NPM v7+ de manera predeterminada bloquea la instalación si detecta diferencias de versiones en los árboles de dependencias comunes.

### 3. La Solución Industrial
1. **Configuración de JSX**: Añadimos `"jsx": "react-jsx"` dentro de las `compilerOptions` en [tsconfig.json](file:///d:/desarrollos/ABDStyles/tsconfig.json) para permitir que `tsc` transpile el JSX utilizando el nuevo runtime síncrono nativo de React.
2. **Abstracción Pura de Props**: Diseñamos componentes 100% agnósticos y puros (sin importar routers ni localizadores como `next-intl` o `next-auth` dentro del paquete `@ajabadia/styles`). En su lugar, el componente recibe wrappers (`LinkComponent`), callbacks e interfaces de traducciones pasadas como propiedades por la aplicación cliente.
3. **Instalación con Fuerza / Omitida**: Para compilar localmente el paquete sin bloquear el pipeline debido a incompatibilidades de versiones entre Lucide-React y React 19, ejecutamos la instalación con:
   ```powershell
   npm install --legacy-peer-deps
   ```
   Y definimos las dependencias de UI como `peerDependencies` en [package.json](file:///d:/desarrollos/ABDStyles/package.json) para que la aplicación padre sea la responsable de proveer las dependencias correctas en tiempo de ejecución.

---

## 🧭 Architectural Rules of Thumb

1.  **Strict HSL String Component Formatting**: In Tailwind CSS v4, dynamic color variables (like `--primary`) must be provided as raw space-separated values (`H S% L%`) without standard `hsl()` wrapping. This is crucial to enable Tailwind to dynamically append opacity modifiers in compiled CSS (e.g., `bg-primary/50` translates to `hsl(H S L / 0.5)`).
2.  **SSR Dynamic Stylesheet Injection**: In Next.js App Router, dynamic styling should always be generated and injected **server-side** (`SSR`) directly into the HTML `<head>`. Doing this inside layout.tsx avoids any unstyled layout flashing (FOUC), which was the primary visual drawback of legacy client-side styling approaches (such as the fetch dynamic style loop).
3.  **Agnostic React Components**: Shared library UI components must never import framework-specific routing hooks (like `next/navigation`, `next-intl`, or `@/i18n/routing`). Instead, use custom wrapper properties (e.g., `LinkComponent`) and direct state callbacks to remain lightweight and usable across different frontend configurations.
4.  **Avoid Hardcoded Colors**: Always utilize semantic theme variables (e.g., `border-border`, `bg-background`, `bg-card`) in CSS rules and component classes instead of fixed values like `bg-neutral-900`. This ensures instant, automatic adjustments when switching light/dark themes or tenant HSL profiles.
