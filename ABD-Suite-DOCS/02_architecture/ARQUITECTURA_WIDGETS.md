# Arquitectura de Micro-Frontends y Widgets del Ecosistema

Este paquete (`ABDEcosystemWidgets`) nace de la necesidad de separar las responsabilidades arquitectónicas (Principio DRY y Single Responsibility) dentro del monorepo, evitando que la librería base de UI (`ABDStyles`) se acople a la lógica de negocio y conectividad.

## 1. El Problema que Resolvemos
Originalmente, componentes con "inteligencia" (que hacían peticiones `fetch`, que leían JWTs de sesión, o que conocían la arquitectura del ecosistema) se colocaron en `ABDStyles`. Esto convirtió a `ABDStyles` en un cajón de sastre, dificultando su uso como un verdadero *Design System* puro.

## 2. Nueva Frontera Arquitectónica
Para evitar la proliferación excesiva de paquetes `package.json`, agruparemos los componentes inteligentes en este paquete (`ABDEcosystemWidgets`), pero estructurados en **subcarpetas temáticas**:

* **`@ajabadia/styles`**: SOLO componentes presentacionales "tontos". Reciben `props` y emiten `eventos`. No saben de APIs, ni de fetch, ni de tokens. (Ej: `Button`, `Modal`, `Table`, `Badge`).
* **`@ajabadia/satellite-sdk`**: SDK puro de backend/frontend para gestionar la criptografía de sesión, JWT, guards de seguridad y utilidades de red. Idealmente sin renderizado complejo de UI.
* **`@ajabadia/ecosystem-widgets` (Este paquete)**: "Smart Components" o Widgets. Usan `@ajabadia/styles` para pintarse y `@ajabadia/satellite-sdk` para conectarse a las APIs del ecosistema.

## 3. Estructura Interna Propuesta (Temática)
Para mantener el orden interno, dividiremos el código en subdirectorios:
- `/src/identity/`: Para componentes de gestión de usuario y organizaciones (Ej: `TenantSelector`, `UserIdentity`, y `LogoutSuccessView` con auditoría automatizada via `logger.audit` de `@ajabadia/satellite-sdk/client`).
- `/src/audit/`: Para visualizadores de logs y seguridad (Ej: `LiveLogViewer`, `AuditDeltaViewer`, el nuevo `AuditHistoryModal`).
- `/src/navigation/`: Para elementos de control global (Ej: `CommandPalette`).

## 4. Estado de Migración (Completado)
Todos los componentes inteligentes con lógica de negocio y conectividad han sido migrados exitosamente de `ABDStyles` a `ABDEcosystemWidgets`:
* **`TenantSelector.tsx`** (Selector multitenant integrado con el contexto global).
* **`CommandPalette.tsx`** (Atajo de control y búsqueda Ctrl+K unificado).
* **`UserIdentity.tsx`** (Avatar y lectura reactiva de sesión central).
* **`LiveLogViewer.tsx`** / **`AuditDeltaViewer.tsx`** (Visualizadores interactivos de logs forenses).
* **`SystemSettings.tsx`** (Ajustes de tema e idioma).
* **`LogoutSuccessView.tsx`** (Pantalla unificada y premium de desconexión con auditoría).

## 5. Arquitectura de Monorepo y Despliegue (pnpm workspaces & Turborepo)
El ecosistema está estructurado como un **pnpm workspace** integrado con **Turborepo** para la orquestación de tareas en desarrollo local:
1. **Resolución Local Automática:** Gracias al archivo [pnpm-workspace.yaml](file:///d:/desarrollos/ABDSuite/pnpm-workspace.yaml) en la raíz, pnpm enlaza automáticamente las librerías locales (`@ajabadia/styles`, `@ajabadia/satellite-sdk`, `@ajabadia/ecosystem-widgets`) en cada satélite sin necesidad de publicarlas a GitHub Packages para pruebas locales.
2. **Orquestación con Turborepo:** La compilación y el desarrollo se gestionan a nivel raíz de forma paralela y ordenada:
   - `pnpm dev`: Inicia todos los servidores Next.js satélites en paralelo.
   - `pnpm build`: Compila de forma secuencial y en orden de dependencia todo el monorepo (primero las librerías, luego las apps) respetando el pipeline configurado en [turbo.json](file:///d:/desarrollos/ABDSuite/turbo.json).
3. **Producción e Integración Continua (CI/CD):** En producción (Vercel/GitHub Actions), cada satélite mantiene su independencia y se compila de forma aislada consumiendo las versiones estables publicadas en GitHub Packages, asegurando desacoplamiento y despliegues atómicos.


## 6. Internacionalización estricta con `next-intl`
Todos los textos de los componentes se extraen obligatoriamente utilizando el hook `useTranslations()` de `next-intl`. Esto asegura que el ecosistema completo reaccione de forma síncrona a los cambios de locale.

## 7. Prioridad a la Composición
El diseño favorece la composición sobre la configuración mediante componentes compuestos (`<Widget.Root>`, `<Widget.Header>`, etc.).

## 8. Siguientes Pasos
1. Continuar certificando la suite ante regresiones visuales o de accesibilidad empleando las suites de auditoría `pnpm run full-audit`.
2. Integrar nuevos widgets de telemetría y gráficos dinámicos para `ABDAnalytics`.
