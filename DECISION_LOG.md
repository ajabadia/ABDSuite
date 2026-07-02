# DECISION_LOG.md — ABDSuite Monorepo

## 2026-07-02 — Unificación de configuración y refactor de monorepo

### 1. Catálogo de versiones (`catalog:`)
- **Decisión**: Migrar dependencias compartidas (TypeScript, React, Next.js, ESLint, Tailwind, etc.) a `pnpm.catalog:` en `package.json` raíz.
- **Motivación**: Versión única para todas las apps del monorepo; evitar desincronización.
- **Alternativa descartada**: Mantener versiones individuales por paquete (mayor riesgo de drift).

### 2. Paquetes compartidos `@repo/`
- **Decisión**: Crear `packages/typescript-config/` y `packages/eslint-config/` con scope `@repo/`.
- **Motivación**: Centralizar tsconfig y ESLint base/nextjs reutilizables, siguiendo convención Turborepo.
- **Nota**: SOLO los satélites Next.js se refactorizan. Librerías (ABDStyles, ABDi18n, etc.) mantienen sus configs propias por su alta variabilidad. ABDQuiz mantiene su eslint.config.mjs propio.

### 3. Resolución de `extends` en tsconfig
- **Decisión**: Usar ruta relativa (`"./base.json"`) cuando un archivo dentro del mismo paquete extiende a otro del mismo paquete.
- **Motivación**: TypeScript resuelve `extends` desde el directorio del archivo contenedor, no desde `node_modules`. Usar `"@repo/typescript-config/base.json"` falla porque el paquete no está en `node_modules` del consumer en tiempo de compilación del propio paquete.
- **Ejemplo**: `packages/typescript-config/nextjs.json` → `"extends": "./base.json"`.

### 4. `devDependencies: workspace:*` para paquetes internos
- **Decisión**: Los paquetes `@repo/typescript-config` y `@repo/eslint-config` deben listarse como `devDependencies: workspace:*` en cada app que los consume.
- **Motivación**: La mera referencia en `tsconfig.json` o `eslint.config.mjs` no crea el symlink en `node_modules`. pnpm necesita la entrada en `dependencies`/`devDependencies` para enlazar el paquete local.
- **Consecuencia**: Siempre que se añada un nuevo consumer de `@repo/*`, hay que agregar la dependencia y ejecutar `pnpm install`.

### 5. Renombrado ABDtenantGobernance → ABDtenantGovernance
- **Decisión**: Renombrar el directorio y actualizar todas las referencias cruzadas (pnpm-workspace.yaml, start-all.bat, superbuild.ps1, deploy.yml, imports internos).
- **Método**: `git mv` (via `move` en Windows) para preservar historial.
- **Motivación**: Corrección de typo en el nombre del paquete/satélite.

### 6. Puertos en `start.bat`
- **Decisión**: Mantener `start.bat` por satélite para arranque manual, pero corregir puertos duplicados.
- **Puertos asignados**: ABDLanding→5000, ABDAuth→5001, ABDtenantGovernance→5002, ABDLogs→5003, ABDAnalytics→5004, ABDFiles→5005, ABD___BASE→3900, ABDQuiz→5020.
- **Criterio**: Sin colisiones, rangos diferenciados (5xxx para satélites estándar, 39xx/50xx para especiales).

### 7. Pipeline Turborepo
- **Decisión**: Añadir `"dependsOn": ["^build"]` a tareas `lint` y `test` en turbo.json.
- **Motivación**: Garantizar que las dependencias internas estén construidas antes de lintear/testear un paquete.
- **Pipeline verificado**: `pnpm turbo run build` → 16/16 paquetes exitoso.

### 8. ABD___BASE se mantiene como template
- **Decisión**: No renombrar ABD___BASE.
- **Motivación**: Es el template/skeleton oficial del equipo para nuevos satélites.

### 9. Archivos de trabajo local en .gitignore
- **Decisión**: `.agent/`, `.brain/`, `scratch/`, `docs/` no se trackean.
- **Estado**: Ya estaban en `.gitignore` desde commits previos.
