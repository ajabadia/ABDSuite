# 🚀 Pasos para Crear, Publicar y Configurar una Nueva Aplicación Satélite en el Ecosistema

Este documento detalla la checklist técnica completa y los pasos necesarios para crear, integrar y desplegar una nueva aplicación satélite en la suite **ABDSuite**, conectarla al proveedor de identidad centralizado, configurar dominios y DNS en producción, y mantener la consistencia del ecosistema.

---

## 🏗️ 1. Scaffolding y Estructura Inicial (Boilerplate)
Para evitar la duplicación de código redundante e incoherencias de maquetación, se utiliza la estructura de [ABD___BASE](file:///d:/desarrollos/ABDSuite/ABD___BASE) como cascarón base:

1. **Duplicar Directorio**: Clona el directorio raíz de `ABD___BASE` para crear la nueva carpeta de tu satélite (ej. `ABDDocsManager`, `ABDFiles`).
2. **Ajustar Metadatos (`package.json`)**:
   * Modifica el campo `"name"` al nombre de tu nueva aplicación.
   * Asegura los enlaces directos locales en `"pnpm.overrides"` o dependencias para enlazar el SDK y los widgets compartidos:
     ```json
     "overrides": {
       "@ajabadia/ecosystem-widgets": "link:../ABDEcosystemWidgets",
       "@ajabadia/satellite-sdk": "link:../ABDSatelliteSDK"
     }
     ```
     *(Nota: Esto permite enlazar localmente con [ABDEcosystemWidgets](file:///d:/desarrollos/ABDSuite/ABDEcosystemWidgets) y [ABDSatelliteSDK](file:///d:/desarrollos/ABDSuite/ABDSatelliteSDK) durante el desarrollo local)*.
   * Modifica los puertos en `"scripts"` para evitar colisiones en desarrollo local (ej. Files utiliza `5005`, etc.).
   * **Consistencia de Dependencias (Catálogo)**: No utilices la sintaxis de catálogo (`"next": "catalog:"`) en los archivos `package.json` de los satélites, ya que se despliegan de forma aislada e independiente en Vercel a partir de sus propios repositorios. En su lugar, consulta las versiones de referencia en el catálogo centralizado del archivo [pnpm-workspace.yaml](file:///d:/desarrollos/ABDSuite/pnpm-workspace.yaml) de la raíz del monorepo y fija exactamente las mismas versiones (sin prefijos de rango como `^` o `~`).
3. **Limpieza e Inicialización**:
   * Configura la lógica base de tu nueva aplicación en `src/features/`, `src/models/`, etc.
   * **Mantén intacto**: El chasis visual (`SidebarNavigation`), el layout de traducción (`src/app/[locale]/layout.tsx`), los archivos de mensajes (`messages/`) y la inyección de branding (`<BrandingStyles />` del SDK en el `<head>` del layout).
   * **Estilos Globales**: Asegura que el chasis de estilos se base en la biblioteca unificada de tokens de diseño [ABDStyles](file:///d:/desarrollos/ABDSuite/ABDStyles).
4. **Configurar Middleware SSO (`src/proxy.ts` / `src/middleware.ts`)**:
   * Modifica el `appId` en el middleware (`withIndustrialAuth`) para que coincida con el identificador del nuevo satélite.

---

## 🛠️ 2. Gestión de Dependencias y Tokens (GitHub Packages)
Las aplicaciones satélite consumen librerías privadas del ámbito `@ajabadia`. Para que tanto localmente como en el servidor de compilación de Vercel puedan descargar estas dependencias:
1. **Registrar en `.npmrc`**: Asegura que la nueva aplicación esté en la lista `APPS` en `scratch/create-npmrc.js` y ejecuta el script para generar un `.npmrc` que use `${GITHUB_NPM_TOKEN}`.
2. **Bumps del SDK**: Si la nueva aplicación depende de código reciente del SDK en [ABDSatelliteSDK](file:///d:/desarrollos/ABDSuite/ABDSatelliteSDK), asegúrate de compilar el SDK, subir la versión (`npm version patch`) y publicarla (`npm publish`) en GitHub Packages. Luego, ejecuta `pnpm install --no-frozen-lockfile` en la aplicación para actualizar su `pnpm-lock.yaml`.

---

## 💻 3. Principios de Código Obligatorios (Estándar de la Suite)
Al codificar la nueva aplicación, se deben seguir estrictamente los siguientes principios arquitectónicos:
* **Patrón de API Routes**: ❌ **Queda terminantemente prohibido escribir lógica de negocio en los API handlers** (de `src/app/api/`). Las rutas de API actúan únicamente como capa de transporte, validan datos con **Zod**, extraen el contexto del JWT (`tenantId`, `roles`) y **delegan directamente** a los servicios de dominio correspondientes en `src/services/`.
* **Modelado Offline-First en el Cliente**:
  * La fuente de verdad inmutable (binarios, versiones, holds) reside en el servidor.
  * La base de datos local en el cliente (**Dexie.js**) se limita exclusivamente a actuar como caché de metadatos de los recursos y listados de lectura rápida. Los binarios no se guardan en Dexie.
* **Control de Aislamiento Multi-tenant**: Toda consulta o guardado a nivel de base de datos o almacenamiento físico **debe incluir el `tenantId` como primer filtro**. Nunca se consultan ni mezclan datos entre diferentes inquilinos.

---

## ☁️ 4. Reglas de Ingesta, Storage y Cuotas (Cloudinary / Storage)
Para los satélites de gestión de assets (como `ABDFiles`):
1. **Verificación de Cuotas**: Antes de iniciar la subida, se debe validar la cuota del tenant usando `TenantQuotaService.hasStorageQuota(tenantId, size)`.
2. **Segregación Física por Prefijo**: Los archivos de almacenamiento físico en Cloudinary se deben organizar prefijando las carpetas dinámicamente con `tenants/{tenantId}/abdfiles/{assetId}`.
3. **Tracking de Consumo**: Cada alta o baja exitosa debe registrar el peso del binario llamando a `UsageService.trackStorage(tenantId, size, type)` para informar de manera directa a [ABDAnalytics](file:///d:/desarrollos/ABDSuite/ABDAnalytics).
4. **Auditoría e Historial Inmutable**: Reporta cada evento relevante de almacenamiento enviando las trazas estructuradas (hashes de binario, tipos de acción, correlation ID) hacia el servicio centralizado de [ABDLogs](file:///d:/desarrollos/ABDSuite/ABDLogs).
5. **Deduplicación**: Implementa la deduplicación de binarios basada en hash SHA-256 únicamente dentro del espacio del mismo `tenantId` para evitar filtraciones de información cross-tenant (si el mismo archivo existe en el tenant, se incrementa el `refCount` del asset lógico y se reutiliza el enlace físico).
6. **Borrado Lógico y Ciclo de Vida**: El borrado nunca es destructivo inmediatamente. Sigue el flujo: 
   `active` ➔ `deleted_pending_retention` ➔ `purge_due` ➔ `purged`.
   Se ejecutan tareas CRON (`/api/cron/data-lifecycle`) para purgar binarios vencidos si no tienen un *legal hold* activo.

---

## ⚙️ 5. Sincronización y Configuración de Variables en Vercel
1. **Actualizar `sync-vercel-envs.js`**: Añade la nueva aplicación junto con su dominio por defecto de Vercel en la lista `apps` de `scratch/sync-vercel-envs.js`.
2. **Subir variables**: Ejecuta el script de sincronización para propagar el `GITHUB_NPM_TOKEN`, URLs de base de datos y JWT secrets a Vercel.
   > [!TIP]
   > En entornos Windows, la CLI de Vercel puede quedarse colgada tras añadir variables. Utiliza un script con un `timeout` (ej. 8 segundos) por comando para forzar la continuación del proceso.

---

## 🔐 6. Registro en el Proveedor de Identidad ([ABDAuth](file:///d:/desarrollos/ABDSuite/ABDAuth))
Para habilitar el inicio de sesión federado y evitar el error de `"Redirect URI mismatch"`:
1. **Registrar en Base de Datos**: Accede al clúster de autenticación (`ABDElevators-Auth`) configurado en [ABDAuth](file:///d:/desarrollos/ABDSuite/ABDAuth) en la colección `applications`.
2. **Configurar Callbacks**: Crea o modifica el documento para la aplicación y añade todas sus URLs de retorno en el array `redirectUris` (ej. `http://localhost:3800/api/auth/federated/callback`, `https://files.abdia.es/api/auth/federated/callback`).

---

## 🌐 7. Dominio Personalizado y DNS (GoDaddy)
1. **Apuntar CNAME**: Configura el subdominio en tu zona DNS apuntando a `cname.vercel-dns.com.`. Puedes automatizar esto usando el script de la API de GoDaddy (`scratch/add-godaddy-dns.js`) con las credenciales de producción correspondientes.
2. **Actualizar URL Pública**: En Vercel, modifica la variable `NEXT_PUBLIC_APP_URL` de la aplicación para que apunte al dominio personalizado final (ej. `https://files.abdia.es`) y re-despliega el proyecto para aplicar los cambios de entorno.

---

## 🔌 8. Integración en el Ecosistema
1. **Vinculación en la Landing**: Añade los enlaces de la nueva aplicación en `getSuiteApps` en [ABDLanding](file:///d:/desarrollos/ABDSuite/ABDLanding) (`src/app/[locale]/page.tsx`) para que aparezca en el menú de aplicaciones de la suite.
2. **Permisos en Gobernanza**: Habilita los scopes de acción correspondientes (ej. `documents:*`) en el panel de control de administración de [ABDtenantGobernance](file:///d:/desarrollos/ABDSuite/ABDtenantGobernance).
3. **Métricas en Analíticas**: Conecta las vistas de consumo y auditorías cruzadas en [ABDAnalytics](file:///d:/desarrollos/ABDSuite/ABDAnalytics) para recolectar el tracking de uso e impacto operacional.

---

## 🤖 9. Automatización de Builds y Desarrollo (Scripts Globales)
Para asegurar que todo el ecosistema compile en armonía:
1. **Actualizar `superbuild.ps1`**: Añade la carpeta de la nueva aplicación al array `$Consumers` en [superbuild.ps1](file:///d:/desarrollos/ABDSuite/superbuild.ps1). Esto garantiza que el script global ejecute la limpieza de caché, instale las dependencias correctas, compile y suba los cambios a git de forma secuencial.
2. **Actualizar `start-all.bat`**: Añade el comando de arranque local con su puerto respectivo en [start-all.bat](file:///d:/desarrollos/ABDSuite/start-all.bat) para iniciar toda la suite en local de forma paralela.

## 📚 Referencias y Grafos Relacionados

* **Especificaciones y Hitos**:
	* [[01_active_specs/ROADMAP.md]]
* **Diseño y Arquitectura**:
	* [[02_architecture/ANALISIS_ARQUITECTURA.md]]
	* [[02_architecture/DISENO_SSO_TENANTS.md]]
* **Grafos de Interrelaciones**:
	* [[grafos/Mapa_Global_Suite.md]]
	* [[grafos/ABDSatelliteSDK.md]]
	* [[grafos/ABDEcosystemWidgets.md]]
	* [[grafos/ABDLanding.md]]
