# 🗺️ Roadmap de la Suite ABD

Este documento actúa como la hoja de ruta y manifiesto de hitos para la suite de aplicaciones **ABD**. 

> [!NOTE]
> **Filosofía de Trabajo**: Este directorio (`ABD-Suite-DOCS`) se utiliza exclusivamente para la planificación, documentación y diseño arquitectónico de la suite. No se realiza desarrollo de software directo aquí. Las decisiones y especificaciones técnicas resultantes se trasladan e implementan de forma independiente en los repositorios de cada proyecto (`ABDAuth`, `ABDQuiz`, `ABDtenantGobernance`, etc.).

---

## 🚦 Estado de los Proyectos

| Proyecto | Estado de Auditoría | Despliegue Actual | Estatus Operativo |
| :--- | :--- | :--- | :--- |
| **`@abd/styles`** | `SYS_CERTIFIED` | GitHub NPM Package | Operativo |
| **`ABDAuth`** | `SYS_CERTIFIED_PROD` | Vercel (`abd-auth.vercel.app`) | Operativo (IdP) |
| **`ABDtenantGobernance`** | `SYS_CERTIFIED` | Vercel (`abd-tenant-gobernance.vercel.app`) | Operativo (Control Plane) |
| **`ABDQuiz`** | `SYS_BREACHED` | Vercel | Brechas detectadas (Audit Failed) |
| **`ABDAnalytics`** | `SYS_CERTIFIED` | Vercel | Operativo (Analíticas) |
| **`@abd/satellite-sdk`** | `SYS_CERTIFIED` | GitHub NPM Package | Operativo (Auth SDK) |
| **`ABDFiles`** | `SYS_CERTIFIED` | Vercel (`files.abdia.es`) (Port 5005) | Fases 1-5 Completas, Resto Pendientes |

---

## 📌 Hitos Realizados y Pendientes

### Fase 1: Infraestructura de Red y Mapeo de Dominios
*   [ ] **1.1 Delegación de DNS en GoDaddy**: Configurar los registros DNS de tu dominio para enlazar subdominios a los proyectos de Vercel.
    *   `auth.tudominio.com` -> `ABDAuth`
    *   `gobernanza.tudominio.com` -> `ABDtenantGobernance`
    *   `quiz.tudominio.com` -> `ABDQuiz`
*   [ ] **1.2 Soporte Wildcard para Multi-Tenancy**: Registrar `*.quiz.tudominio.com` en Vercel y configurar un CNAME comodín en GoDaddy para permitir subdominios dinámicos por academia/cliente.
*   [ ] **1.3 Validación de Cookies Cross-Domain**: Verificar si se requiere el atributo `Domain: '.tudominio.com'` en la sesión federada o si el flujo de redirecciones OAuth2 estándar cubre los casos de uso con cookies locales.
*   [x] **1.4 Firma y Validación Criptográfica de la Sesión**: Adaptar las aplicaciones satélite (`ABDQuiz`, `ABDtenantGobernance`) para que la cookie `abd_session` almacene directamente el JWT firmado por `ABDAuth` y validar su firma usando `AUTH_JWT_SECRET` en `getIndustrialSession()`.
*   [x] **1.5 Aislamiento y Mapeo de Subdominios (Cross-Tenant Guard)**: Configurar los satélites para inferir el Tenant a partir del subdominio de la petición y validar que coincida con el `tenantId` codificado en el JWT, denegando el acceso si hay discrepancias.

### Fase 2: Lanzador Central de Aplicaciones y Gestión de Accesos (Ecosystem Launcher & RBAC)
*   [x] **2.1 Diseño del Launcher Dashboard**: Diseñar una interfaz limpia, de alta densidad visual y bajo el estándar *Uncodixfy / Tech-Noir* en `ABDAuth` (`/dashboard`).
*   [x] **2.2 Grid de Aplicaciones Dinámico**: Mostrar las tarjetas de aplicaciones autorizadas para el usuario y su Tenant.
*   [x] **2.3 Conectores SSO**: Asegurar que al pulsar en una aplicación, el usuario viaje al subdominio del satélite y complete el handshake de forma instantánea sin requerir re-autenticación.
*   [x] **2.4 Mapeo de Usuarios-Tenants (CRUD)**: Panel para configurar membresías organizacionales y roles por usuario.
*   [x] **2.5 Control de Aplicaciones Federadas (CRUD)**: Registro centralizado de aplicaciones y credenciales satélites autorizadas.
*   [x] **2.6 Consola de Usuarios Globales (CRUD)**: Creación, suspensión y auditoría de perfiles en el IdP.

### Fase 3: Estandarización de Calidad y Estilos
*   [x] **3.1 Centralización de Core CSS en `@abd/styles`**: Crear `industrial-core.css` en la biblioteca con las variables, rejilla, grain y clases de cristal, reduciendo el `globals.css` de los satélites a simples imports.
*   [x] **3.2 Centralización de Componentes Críticos (`@abd/ui`)**: Mudar `SystemSettings` y `TacticalSidebar` a la biblioteca, abstrayendo las rutas e i18n vía props para garantizar 100% de uniformidad gráfica.
*   [x] **3.3 Sincronización de Pipelines de Auditoría**: Homologar el script `abd-audit.ps1` e integrar análisis estático de estilos en `arch-guard.mjs` (bloquear colores hardcodeados y esquinas redondeadas).
*   [x] **3.4 Auditoría de Componentes Compartibles**: Revisar todas las aplicaciones de la suite para identificar más componentes susceptibles de unificarse en `@abd/styles` (equivalente a lo hecho con `SystemSettings` y `TacticalSidebar`).
*   [x] **3.5 Formulario de Personalización Visual Avanzado (Live Style Preview)**: Crear el componente `TenantBrandingForm.tsx` con selectores HSL y de esquinas redondeadas, y construir una caja de vista previa interactiva en vivo que refleje cambios de estilo al instante.
*   [x] **3.6 Migración de ABDAuth a Estilos Centralizados**: Agregar la dependencia de `@abd/styles` en `ABDAuth` y refactorizar su layout raíz para leer la sesión del tenant y aplicar estilos dinámicos server-side (SSR).

### Fase 4: Desacoplamiento de Auditoría a `ABDLogs`
*   [x] **4.1 Creación del Microservicio `ABDLogs`**: Inicializar un repositorio independiente para centralizar la telemetría de logs.
*   [x] **4.2 Endpoints REST**: Implementar `POST /api/logs` y `GET /api/logs` protegidos con tokens de seguridad inter-servicio.
*   [x] **4.3 Migración de Ingestores**: Actualizar `ABDtenantGobernance` y `ABDQuiz` para que envíen sus logs asíncronos mediante peticiones HTTP `fetch` a `ABDLogs` en lugar de conexiones directas de base de datos.
*   [x] **4.4 Panel de Auditoría Global**: Centralizar la visualización de logs de toda la suite en la consola de gobernanza consumiendo la API de `ABDLogs`.

### Fase 5: Gobernanza Avanzada de Accesos y Telemetría SOC2
*   [x] **5.1 Licenciamiento Estricto y Resolución de `allowedApps`**: Enforzar validaciones estrictas de licenciamiento a nivel de Tenant y membresía de Usuario. Integración de claims en tokens JWT sin fallbacks laxos de longitud.
*   [x] **5.2 Intercepción y Mitigación de Bucles SSO (SSO Loop Prevention)**: Diseñar e implementar el control dinámico de errores en el endpoint de autorización para interrumpir redirecciones cíclicas infinitas y mostrar advertencias contextuales con el `appId`.
*   [x] **5.3 Auditoría Detallada y de Granularidad Fina**: Modificar la telemetría para registrar eventos específicos como `UPDATE_TENANT_LICENSING` y `USER_UPDATED` detallando los campos alterados (`updatedFields`) para facilitar el cumplimiento SOC2.
*   [x] **5.4 Consola de Telemetría y Ingesta en Caliente (Live Telemetry & Logs Dashboard)**: Crear un panel de visualización en vivo (hot log streaming) para handshakes, fallos del SSO y eventos de seguridad con geolocalización IP en la consola de control.
*   [x] **5.5 Cadena de Bloques de Auditoría Criptográfica (Cryptographic Log Chaining)**: Encriptar y encadenar hashes SHA-256 acumulativos en la base de datos de logs remotos (`ABDLogs`) para garantizar inmutabilidad absoluta contra manipulaciones de auditoría.
*   [x] **5.6 Período de Gracia para MFA Obligatorio y Robustecimiento Biométrico (MFA WebAuthn & Grace Period)**: Configurar avisos e inicio de sesión temporal con cuenta atrás de accesos permitidos. Implementación de WebAuthn (Passkeys/FaceID) para roles de alto privilegio y seguridad avanzada.
*   [x] **5.7 Conmutador Rápido de Contexto Multitenant (Command Palette `Ctrl+K`)**: Desarrollar la paleta de comandos interactiva, el botón de gatillo visual flotante junto a la configuración del sistema, y el atajo de teclado global para salto rápido y paneles administrativos.
*   [x] **5.8 Marketplace de Satélites y Solicitudes de Licencia**: UI de catálogo de aplicaciones donde los administradores de Tenant pueden solicitar nuevos módulos y los Super Administradores pueden aprobarlos.
*   [x] **5.9 Detección Predictiva de Amenazas y Reportes de Inteligencia (ABD-IA & SOC2 Heuristics)**: Desarrollar modelos de análisis de anomalías operativas basados en heurísticas de IA, y generar reportes ejecutivos sumarios consolidados de seguridad de logs.
*   [x] **5.10 Refinamiento de Permisos Espaciales (Jerárquicos)**: Implementar la gestión de visibilidad (`INTERNAL`, `PRIVATE`, `PUBLIC`) por espacio materializado con herencia recursiva en la consola de gobernanza.

### Fase 6: Arquitectura de Integración, Multi-Tenancy Físico y DX
*   [x] **6.1 SDK Centralizado de Satélites (`@abd/satellite-sdk`)**: Integrado en `ABDQuiz` con `withIndustrialAuth`, `BrandingStyles`, `createAuthRouteHandler` y `getIndustrialSession`. SDK certificado.
*   [x] **6.2 Desconexión Unificada en Cascada (Single Logout - SLO)**: Diseñar e implementar un sistema híbrido de Single Logout (front-channel silencioso vía iframes + verificación back-channel en el middleware de los satélites) para invalidar sesiones concurrentemente en toda la suite. Se unifica la pantalla visual de desconexión y control de alertas de accesos fallidos (`LogoutSuccessView` en `@ajabadia/ecosystem-widgets`) con auditoría automatizada via `logger.audit` de `@ajabadia/satellite-sdk/client` en todos los satélites.
*   [x] **6.3 Orquestación Dinámica de Bases de Datos por Cliente (Multi-DB Pooling)**: Lógica en el backend para abrir pools de conexiones segregados al vuelo cuando el Tenant tiene configurada la estrategia `DATABASE_PER_TENANT`. *(Completado y replicado en todos los satélites).*
*   [ ] **6.4 Almacenamiento de Sesiones Compartido (Redis Session Store)**: Transición a un backend de gestión de sesiones industrial respaldado por Redis para alta disponibilidad y baja latencia.
*   [ ] **6.5 Federación de Identidades Avanzada (OIDC/SAML Bridge)**: Pasarela de federación SAML y OIDC para la integración sin fricciones de clientes corporativos externos e infraestructura legacy (como auditoría del puente AgRAG).
*   [ ] **6.6 Gateway CSS en el Edge con Vercel Edge API**: Implementación de un endpoint `/api/theme` en `@abd/styles` que consulte la base de datos de branding del tenant y sirva hojas de estilo CSS compiladas en 10ms utilizando headers `stale-while-revalidate`.
*   [ ] **6.7 Simulador Sandbox para Desarrolladores (Dev Simulator Console)**: Panel de prueba en local que permita inyectar JWTs corruptos, forzar pérdida de licencias o simular cambios de rol instantáneos para pruebas de QA rápidas.
*   [ ] **6.8 Portabilidad de Datos y Borrado de Logs por Tenant (GDPR)**: Panel de descarga cifrada (JSON/ZIP) para volcado de base de datos y logs por `tenantId`, así como gestión del derecho al olvido y borrado selectivo de logs. *(Nota: Revisar la implementación de referencia que ya existe en el proyecto ABDAgRAG para extrapolarla aquí).*
*   [ ] **6.9 Automatización de Certificación y Autocorrección (Purity Enforcement)**: Integración de ejecuciones diarias de auditoría en CI/CD y mecanismos autónomos de autocorrección de código contra violaciones de calidad.

### Fase 7: Funcionalidades Avanzadas de Negocio y LMS (ABDQuiz)
*   [ ] **7.1 Módulo de Preguntas de Desarrollo**: Soporte para respuestas en texto libre con sistema integrado de subida y almacenamiento de archivos de respaldo en exámenes.
*   [ ] **7.2 Canal de Chat Alumno-Profesor**: Implementación de un chat ligero en tiempo real sobre incidencias o consultas durante los exámenes en curso.
*   [ ] **7.3 Tutoría y Feedback con Inteligencia Actor/IA**: Integración con un tutor IA para proveer retroalimentación semántica del rendimiento del estudiante directamente en la revisión del examen.
*   [ ] **7.4 Robustecimiento de Roles Académicos (Rol `PROFESSOR`)**: Implementación estricta de permisos para el rol de profesor, con privilegios restringidos a la edición de sus propias materias y tutorías de alumnos.
*   [ ] **7.5 Certificación de Resultados con PDF Firmado**: Generación automática de certificados en PDF firmados digitalmente para estudiantes que aprueben los itinerarios académicos oficiales.
*   [ ] **7.6 Cuadro de Mando de KPIs Académicos y Facturación**: Panel analítico para directores de academias con estadísticas de progreso del alumno y métricas de facturación del tenant.

### Fase 8: Infraestructura Transversal de Gobernanza Espacial (Pre-Requisito para Satélites RAG/Docs)
*   [x] **8.1 Motor de Evaluación ABAC (Guardian Engine)**: Importación y adaptación del motor de permisos `GuardianEngine` dentro de `ABDtenantGobernance`. Despliegue de endpoint interno `POST /api/internal/guardian/evaluate` para ser consumido de manera federada por cualquier satélite.
*   [x] **8.2 Selector de Contexto Espacial (`SpaceSelector`)**: Ampliación del actual `TenantSelector` (en `@abd/ecosystem-widgets`) integrando un sub-menú para que el usuario determine su espacio activo de trabajo (ej. Departamento de RRHH o Ventas). (SOLUCIONADO y unificado en `SmartNavbar`).
*   [x] **8.3 Aislamiento de Datos por Espacio en SDK (Row-Level Security)**: Redefinido. Se eliminó el acoplamiento rígido de Mongoose del SDK en favor de validaciones de aislamiento lógico en la capa de servicios de los satélites para mejorar la portabilidad y DX.
*   [x] **8.4 Linkado Polimórfico de Assets a Espacios (`AssetSpaceLink`)**: Esquema Many-to-Many centralizado para permitir que un mismo recurso (Documento, Corpus RAG) pertenezca transversalmente a varios espacios sin duplicación. *(Completado: Modelo, capa de servicio transaccional, propagación recursiva de rutas jerárquicas y modal UI de gobernanza implementados y certificados).*
*   [x] **8.5 Gobernanza Global de Logs en `ABDLogs`**: Todo lo relacionado con logs y telemetría se gobierna estrictamente en el satélite `ABDLogs`. Este satélite se expandirá para soportar funciones de agregación, estadísticas visuales y cuadros de mando SOC2 en el futuro.

### Fase 9: Escalabilidad, Seguridad y Operaciones Avanzadas (SOC2 & Enterprise)
*   [ ] **9.1 Migración de Cloudinary a Amazon S3**: Mudar el almacenamiento de archivos de ABDFiles a un bucket S3 o compatible (usando el plan gratuito de 12 meses de AWS S3 con 5GB, Cloudflare R2 con 10GB gratis perpetuos, o MinIO local).
*   [ ] **9.2 Introducción de Event Bus (Planificación)**: Diseñar la arquitectura orientada a eventos usando un bus de mensajería (como Kafka o RabbitMQ) para desacoplar las integraciones y notificaciones de la suite.
*   [ ] **9.3 Motores de Búsqueda Dedicados**: Integrar Elasticsearch o OpenSearch para realizar búsquedas multi-tenant avanzadas ultrarrápidas y tolerantes a errores sobre textos indexados.
*   [ ] **9.4 Integración Completa de ABAC**: Conectar los diferentes satélites de la suite al motor centralizado de evaluación `GuardianEngine` para aplicar reglas de acceso contextuales complejas.
*   [ ] **9.5 Cifrado de Datos a Nivel de Esquema**: Implementar encriptación en campos sensibles (PII como emails, teléfonos o contraseñas) a nivel de esquema de MongoDB en todos los modelos.
*   [ ] **9.6 Versionado Dinámico de Esquemas de Eventos**: Diseñar un adaptador/registrador de esquemas para permitir la evolución fluida de los formatos de mensajes sin interrumpir servicios legacy.
*   [ ] **9.7 Paneles de Observabilidad Operativa**: Crear paneles de monitorización de rendimiento (uso de CPU, tiempos de API, errores recurrentes) para una supervisión proactiva en producción.
*   [ ] **9.8 Integración OAuth2 en `ABDAuth` para Storage Externo**: Analizar y diseñar cómo `ABDAuth` gestiona el consentimiento y almacenamiento seguro de tokens OAuth2 de Google/Microsoft a nivel de usuario/tenant, facilitando su consumo en `ABDFiles`.
*   [ ] **9.9 Gobernanza y Migraciones de Almacenamiento**: Revisar en `ABDtenantGobernance` la configuración del conector activo por Tenant. Investigar políticas de migración automática de archivos entre proveedores y soporte para múltiples conectores activos según la sensibilidad del documento.
*   [ ] **9.10 Aislamiento Estricto de Deduplicación**: Validar que la deduplicación de hashes SHA-256 se aplique estrictamente de forma aislada por Tenant (`intra-tenant`), impidiendo fugas de metadatos colaterales incluso si los inquilinos comparten el mismo bucket o proveedor físico.
*   [ ] **9.11 Enrutamiento de Dominio Único (Next.js Multi-Zones / Central Proxy)**: Estudiar el enrutamiento unificado del ecosistema bajo un solo dominio (`abd.com/auth`, `abd.com/analytics`) para eliminar problemas de CORS y unificar la gestión de cookies de sesión sin subdominios cruzados.
*   [ ] **9.12 Orquestador Dinámico de Migraciones Multi-Tenant**: Desarrollar un sistema de ejecución de migraciones centralizado que consulte la base de datos de Gobernanza para obtener el catálogo de inquilinos activos y aplique esquemas o cambios de datos secuencialmente en sus bases de datos aisladas (`DATABASE_PER_TENANT`).


---

## 📈 Historial de Sesiones de Trabajo y Decisiones

### Sesión 1: 19 de Mayo de 2026
*   **Creación de Documentación**: Apertura de `ABD-Suite-DOCS`, `ANALISIS_ARQUITECTURA.md` y `ROADMAP.md`.
*   **Definición de Dominios**: Modelo de subdominios (`auth.`, `quiz.`, `gobernanza.`) con cookies de federación locales en cada satélite.
*   **Definición de Launcher**: Ubicado en el `/dashboard` de `ABDAuth`.
*   **Auditoría Gráfica Realizada ([AUDITORIA_ESTILOS.md](file:///D:/desarrollos/ABD-Suite-DOCS/AUDITORIA_ESTILOS.md))**:
    *   *Hallazgos*: Desfase de fuentes (Inter en Auth vs Geist en satélites), discrepancia en el color base del fondo abisal y duplicación/drift del sidebar y del dropdown de configuración.
    *   *Acuerdo*: Modificar `@abd/styles` para exportar el CSS común (`industrial-core.css`) y estructurar la centralización de componentes visuales (`@abd/ui` o similar).

### Sesión 2: 19 de Mayo de 2026 (Auditoría de Ajuste Gráfico)
*   **Verificación de Estilos Unificados**: Se comprobó que `ABDAuth`, `ABDtenantGobernance` and `ABDQuiz` importan e integran el núcleo visual de `@abd/styles` (`industrial-core.css`) bajo Tailwind CSS v4.
*   **Resolución de Desviaciones**:
    *   Se identificó un fallo en la fase de Pureza (4/6) y Calidad de Código (6/6) en `ABDtenantGobernance` debido a un casteo con `any` (`LinkComponent={Link as any}`).
    *   Se corrigió el error en `SidebarNavigation.tsx` implementando un componente wrapper `LocalizedLink` tipado de forma estricta.
    *   Se ejecutaron los scripts de validación `abd-audit.ps1` / `pnpm run full-audit` confirmando que las tres aplicaciones obtienen la certificación `PASSED [OK]` sin errores.
*   **Actualización del Manifiesto**: Se marcaron como completados los hitos de la Fase 3 de estandarización y calidad.

### Sesión 3: 19 de Mayo de 2026 (Centralización del Pipeline de Auditoría)
*   **Unificación y Centralización**: Se trasladó la lógica de `abd-audit.ps1` y `arch-guard.mjs` de manera unificada a `@abd/styles/scripts/` para evitar la desincronización futura de scripts en los distintos repositorios.
*   **Patrón Delegador en Satélites**: Se simplificaron los scripts locales de `ABDAuth`, `ABDtenantGobernance` y `ABDQuiz` para que apunten al script unificado de `node_modules/@abd/styles`.
*   **Nuevas Reglas de Calidad Estética**: Se agregaron chequeos automáticos en el validador para requerir el CSS unificado de la suite (`FIRE:ABD_STYLES_MISSING`) y bloquear el uso de colores fijos hexadecimales o rgb (`FIRE:HARDCODED_COLOR_CSS`), aislando el análisis estático de estilos a la fase estructural y filtrando falsos positivos en máscaras y degradados.
*   **Purga de Caché de Compilación**: Se integró la eliminación de la carpeta `.next` al inicio de la ejecución para prevenir falsos negativos de TypeScript y ESLint debidos a caché corrupta o desactualizada.

### Sesión 4: 20 de Mayo de 2026 (Centralización de Auditoría en Producción & Vercel Sync)
*   **Alineamiento e Integración**: Despliegue de variables de entorno seguras (`LOGS_SECRET_TOKEN`, `AUTH_JWT_SECRET`, `NEXT_PUBLIC_APP_ID`) en todos los satélites locales y sus respectivos proyectos en Vercel.
*   **Inyección en Caliente**: Modificación del ingestor `ABDLogs` para dar soporte a campos delta dinámicos (`previousState` en Mongoose).
*   **Homogeneización y Desacoplamiento**: Culminación exitosa del desacoplamiento de logs a `ABDLogs` mediante cliente HTTP no bloqueante y visor unificado en el Control Plane de Gobernanza.

### Sesión 5: 20 de Mayo de 2026 (Gobernanza de Accesos, Prevención de Bucles y Trazabilidad Extendida)
*   **Licenciamiento y Handshake de Rigor**: Implementación de controles estrictos de `allowedApps` en `ABDAuth` y `ABDtenantGobernance`, garantizando la restricción del Super Admin en tenants sin licencia.
*   **Prevención de Bucles Infinitos**: Manejo e intercepción de `app_not_allowed` en el flujo de SSO, redirigiendo a alertas contextuales enriquecidas con el `appId`.
*   **Consistencia y Trazabilidad**: Clasificación dinámica de eventos (`UPDATE_TENANT_LICENSING` para cambios de licencias) y cobertura de auditoría completa para edición de usuarios (`USER_UPDATED` con `updatedFields` para auditorías de cumplimiento).
*   **Roadmap de Innovación**: Incorporación de hitos propuestos de telemetría de red, cripto-auditoría encadenada, períodos de gracia para MFA e interfaces rápidas de control (`Ctrl+K`) (Fase 5) y arquitectura de integración, multi-tenancy físico y DX (Fase 6).

### Sesión 6: 20 de Mayo de 2026 (Integración ABDSatelliteSDK + Mejora de Componentes Compartidos)
*   **Integración del SDK en ABDQuiz**: Migración completa para consumir `@abd/satellite-sdk`. Sustituidos endpoints manuales de auth por `createAuthRouteHandler`, el middleware por `withIndustrialAuth`, y la sesión por `getIndustrialSession`. El RSC `<BrandingStyles />` se inyecta en el layout raíz para Zero-FOUC.
*   **Corrección de Error Crítico RSC Build**: Resuelto `TypeError: (0, X.createContext) is not a function`. Causa: `import React from 'react'` en `BrandingStyles.tsx` del SDK fuerza la carga del React completo en el layer RSC de Turbopack, donde solo existe la build `react-server` sin `createContext`. Fix: shorthand JSX `<>...</>` que solo usa `react/jsx-runtime`.
*   **Mejora de Componentes en `@abd/styles`**: `'use client'` añadido a `SystemSettings` y `TacticalSidebar`. URLs hardcodeadas parametrizadas (`signinUrl`, `logoutUrl`, `homeHref`). ARIA mejorado en `TacticalSidebar`.
*   **Hito 6.1 completado**: `@abd/satellite-sdk` certificado e integrado en `ABDQuiz`.

### Sesión 7: 20 de Mayo de 2026 (Implementación y Certificación de la Paleta de Comandos Ctrl+K)
*   **Diseño Centralizado**: Creación del componente reutilizable `CommandPalette.tsx` en `@abd/styles` con soporte para listeners de teclado (`Ctrl+K` / `Cmd+K`), navegación por teclado (`ArrowUp`, `ArrowDown`, `Enter`, `Escape`), filtrado difuso agrupado por categorías y diseño premium *Abisal/Tech-Noir* con glassmorphism y grain.
*   **Enlace de Desarrollo y Symlink**: Vinculación local de `@abd/styles` (`file:../ABDStyles`) en `package.json` de `ABDtenantGobernance` para desarrollo interactivo inmediato.
*   **Coordinación e Integración**: Implementación del componente `GovernanceCommandPalette.tsx` inyectando comandos específicos (redirección a secciones administrativas, cambio de idioma reactivo a la ruta local, cerrado de sesión seguro y gatillo de simulación de SystemSettings).
*   **Gatillo Visual Canónico**: Integración de un botón de búsqueda flotante de estilo industrial premium en la esquina superior derecha (`fixed top-6 right-6`), al lado de la rueda dentada de configuración del sistema, facilitando la accesibilidad y el descubrimiento para el usuario sin memorizar atajos.
*   **Auditoría y Certificación Exitosa**: Compilación de la aplicación e inicio de auditoría culminando con la certificación industrial **`[AUDIT] SYSTEM CERTIFIED - ERA 11 COMPLIANT [OK]`** en todas sus fases.

### Sesión 8: 20 de Mayo de 2026 (Depuración de Tailwind v4 y Consolidación de Shell Layouts)
*   **Corrección de Analizador de Componentes UI**: Se diagnosticó que `ABDtenantGobernance` estaba purgando erróneamente las clases utilitarias dinámicas del menú lateral (`-translate-x-full`). Se solucionó inyectando `@source "../../node_modules/@abd/styles/dist/**/*.js";` en el `globals.css` central.
*   **Alineamiento del Shell de Componentes**: Modificación de las pantallas base de `ABDtenantGobernance` (`page.tsx` y `admin/page.tsx`) integrándolas bajo el mismo estándar de espaciado dinámico flotante que `ABDAuth` (incluyendo `pt-24 pb-12` y `relative z-10`), erradicando sobre-posicionamientos con los gatillos de configuración y la hamburguesa del menú.
*   **Verificación Exhaustiva**: Se confirmaron idénticas directivas de compilación `@source` ya activas y operativas en los satélites `ABDLogs` y `ABDQuiz`.

### Sesión 9: 20 de Mayo de 2026 (Completitud Fase 2: Gobernanza de Usuarios)
*   **API Server-to-Server**: Creación de endpoint interno `POST/GET/PATCH /api/internal/users` en `ABDAuth` con protección `x-internal-iam-key`.
*   **Flujo de Invitación Aséptico**: Creación de modal en `ABDtenantGobernance` para invitar usuarios definiendo su rol y apps permitidas. Envío de emails transaccionales mediante Resend (simulado en dev).
*   **Módulo de Identidad**: Generación de tokens de activación efímeros en `ABDAuth` y UI de activación `/auth/activate` para establecer la contraseña inicial con encriptación `bcrypt`.
*   **Auditoría Industrial**: Resolución de advertencias A11y, TSC, `any` e I18n alcanzando el certificado de pureza en `ABDtenantGobernance`.

### Sesión 10: 20 de Mayo de 2026 (Completitud Fase 3: Jerarquía y Permisos ABAC)
*   **Modelos y Validaciones**: Creación de los esquemas `PermissionGroup` y `PermissionPolicy` con `Zod` y `Mongoose`.
*   **Capa de Servicio**: Implementación de `PermissionService` con lógica BFS para resolución recursiva de políticas heredadas.
*   **UI/UX de Alta Densidad**: Desarrollo de `PermissionsPage`, `GroupFormModal` y `PolicyFormModal` alineados a los estándares visuales de `@abd/styles`.
*   **Integración y Certificación**: Extensión de logs de auditoría para entidades de permiso. Aprobación completa del script `abd-audit.ps1` tras aplicar correcciones de pureza (`any` -> `unknown`), tipado estricto (TSC), I18N y accesibilidad en componentes de React.

### Sesión 11: 21 de Mayo de 2026 (Integración Multi-Tenant Completa y Anti-IDOR en ABDQuiz y ABDLogs)
*   **Conmutación Global del Contexto**: Integración del selector visual `TenantSelector` flotante de `@abd/styles` en los layouts principales de `ABDQuiz` y `ABDLogs`.
*   **Aislamiento y Seguridad Anti-IDOR**: Refactorización de las APIs de auditoría y de las Server Actions de reactivos (`question.ts`), plantillas de examen (`examConfig.ts`) e intentos (`quiz.ts`) en `ABDQuiz`. Si un usuario `ADMIN` estándar altera el parámetro `?tenantId=...` en la URL o en peticiones al backend, las consultas e intromisiones se interceptan y redirigen irrevocablemente al tenant de su propia sesión de usuario.
*   **Propagación de Parámetros**: Adaptación de la navegación táctica (`SidebarNavigation`) y las vistas administrativas (dashboard principal, consola de corpus, impugnaciones, control de intentos y parametrizador de exámenes) para recibir `searchParams` y mantener el contexto activo del inquilino seleccionado para los usuarios `SUPER_ADMIN`.
*   **Certificación y Build**: Corrección del commit hash desfasado de `@abd/styles` en `ABDQuiz` y compilación e instalación exitosas (`pnpm install` y `pnpm run build`) del proyecto con cero errores.

### Sesión 12: 21 de Mayo de 2026 (Single Logout Federado y Estabilidad de Rate Limiting)
*   **Single Logout (SLO) Federado**: Implementación híbrida de desconexión unificada en cascada mediante canal frontal (silent iframes invisibles en la ruta `/api/auth/logout` del IdP) y validación en canal trasero en el middleware del SDK (`ABDSatelliteSDK`).
*   **Eliminación de Logins Locales redundantes**: Ocultación del botón de login en el panel de configuración de los satélites (`ABDQuiz`, `ABDLogs`, `ABDtenantGobernance`) para canalizar toda autenticación a través del portal centralizado `ABDAuth`.
*   **Resolución de Bloqueos de Rate Limiter (::1)**: Corrección de un fallo crítico en `RateLimitRepository.ts` donde la comparación de fecha de expiración fallaba debido a discrepancias en el tipado/serialización de fechas en el runtime. Se introdujo una conversión explícita (`new Date(doc.expireAt) < now`) y se creó un script administrador de limpieza (`clear-rate-limits.ts`) para purgar IPs bloqueadas en MongoDB local/desarrollo.

---

## Backlog de Mejoras Arquitectónicas

### [IMPLEMENTADO ✅] Componente Transversal de Selección de Tenant (TenantSelector)

**Contexto y Problema original:**
Anteriormente, la selección del tenant activo se repetía en múltiples páginas de `ABDtenantGobernance` (usuarios, permisos, espacios, etc.) mediante desplegables locales ad-hoc, violando el principio DRY y creando inconsistencias en la experiencia de usuario. No existía un componente centralizado que filtrara el contexto de tenant de manera global.

**Solución Implementada:**
Se ha desarrollado un componente unificado `TenantSelector` dentro de la librería compartida `@abd/styles` e integrado globalmente en la barra de controles flotante (`fixed top-6 right-6`) de los layouts principales en `ABDtenantGobernance` y `ABDLogs`.

1. **Seguridad y Reactividad:**
   - **Super Admin**: Despliega un menú con buscador interactivo y listado completo de tenants para conmutar contextos rápidamente.
   - **Admin de Tenant / Usuario**: Actúa como un badge de lectura inerte, informativo y estéril que muestra únicamente el tenant activo.
   - **Enrutamiento y URL**: Al cambiar de inquilino, se actualiza el parámetro `?tenantId=...` en la barra de direcciones de forma reactiva, sincronizando de inmediato las consultas.
   - **Aislamiento en el Backend**: Los endpoints sensibles (ej. `/api/admin/audit`) sobrescriben el parámetro `tenantId` con el de la sesión para usuarios no privilegiados, impidiendo la lectura de registros ajenos mediante alteración de URLs.

**Notas tcnicas:**
- El botn de rueda dentada (SystemSettings) en @abd/styles podra ser el punto de integracin natural  estudiar si es mejor un componente compuesto o independiente.
- Persistencia opcional del tenant seleccionado en localStorage para que no se pierda entre navegaciones.
- El componente debe ser compatible con Tailwind v4 y el sistema de tokens de @abd/styles.

**Prioridad estimada:** Alta (deuda tcnica que afecta UX y seguridad)
**Esfuerzo estimado:** M (media sesin de diseo + implementacin en @abd/styles + integracin en satlites)

### Sesión 13: 21 de Mayo de 2026 (Orquestación Dinámica de Bases de Datos Multi-Tenant y DX)
*   **Aislamiento Físico e Híbrido**: Implementación de las estrategias `DATABASE_PER_TENANT` (base de datos dedicada `abd_tenant_${dbPrefix}`) y `COLLECTION_PREFIX` (colección prefijada `${dbPrefix}_${collectionName}`) en `ABDQuiz`.
*   **Mongoose Proxy y AsyncLocalStorage (Zero-Refactor)**: Diseño y despliegue del ayudante `getTenantModel` y el middleware `withTenantContext`. Las consultas de los modelos de Mongoose se conmutan automáticamente según el contexto de sesión del hilo de ejecución.
*   **Hot Module Replacement (HMR) y Pooling**: Creación de un pool de conexiones global persistente (`tenantConnections`) para evitar sockets huérfanos y reconexiones repetidas en el entorno de desarrollo rápido.
*   **DX de Validación y Build de Producción**: Adaptación y flexibilización de los esquemas y tipado de TypeScript en los modelos (`IExamAttempt`) para soportar de manera consistente asignaciones directas de `ObjectId` o `string` e inicios de sesión nulos. Compilación exitosa del bundle de producción sin fallos.

### Sesión 14: 22 de Mayo de 2026 (Auditoría de Calidad Total y Componentes Compartibles - Hito 3.4)
*   **Auditoría de Componentes Compartibles (Hito 3.4)**: Identificación e integración de `TenantSelector` como componente unificado en la librería central `@abd/styles`.
*   **Propagación de Refactorización**: Despliegue e implementación de las mejoras y tipados en el `TenantSelector` a través de todos los satélites (`ABDQuiz`, `ABDLogs`, `ABDtenantGobernance`).
*   **Calidad de Código y Estrictez**: Resolución de deuda técnica acumulada abordando warnings de ESLint (e.g., llamadas síncronas a `setState` en `useEffect`, reglas A11y para `aria-label`, tipados dinámicos con `any` e internacionalización dura de strings).
*   **Certificación Industrial Uniforme**: Verificación exitosa de los scripts `pnpm run build` y `./scripts/abd-audit.ps1` en los cuatro repositorios principales (`ABDAuth`, `ABDQuiz`, `ABDLogs`, `ABDtenantGobernance`), logrando la certificación `ERA 11 COMPLIANT` libre de advertencias en todas las fases de compilación y empaquetado.

### Sesión 15: 22 de Mayo de 2026 (Refinamiento de Permisos y Gobernanza Polimórfica en Espacios)
*   **Arquitectura de Espacios Polimórficos**: Modificación profunda del esquema de Espacios (`SpaceSchema`) en ABDtenantGobernance para integrar un modelo Many-to-Many polimórfico a través del array `collaborators`, enlazando entidades `USER` y `GROUP` para delegación de permisos sin acoplamiento duro.
*   **Gestión Visual de Colaboradores**: Implementación de la UI `ManageSpaceCollaboratorsModal` con buscador federado en la base de datos de usuarios y grupos para asignar visibilidad recursiva (`propagates`) y roles granulares (`VIEWER`, `EDITOR`, `ADMIN`).
*   **Aseguramiento de Calidad i18n**: Integración de nuevas claves de traducción para la gestión de espacios en los diccionarios inglés (`en.json`) y español (`es.json`), eliminando errores de tiempo de ejecución `IntlError` por falta de resolución `dashboard.spaces.manage_collaborators`.
*   **Despliegue y Conformidad (Hito 5.10 Parcial)**: Integración exitosa y paso satisfactorio de auditorías de calidad `pnpm run full-audit` bajo los estándares Abisales `Tech-Noir`.

### Sesión 16: 22 de Mayo de 2026 (Infraestructura Transversal ABAC, Selector de Espacios y Subsanación Global)
*   **Motor ABAC Transversal (GuardianEngine)**: Implementación de la lógica pura del motor `GuardianEngine` en `ABDtenantGobernance` con el endpoint federado `/api/internal/guardian/evaluate`.
*   **Selector de Contexto Unificado (`SpaceSelector`)**: Modificación de `TenantSelector.tsx` en `@abd/styles` para integrar la propagación dinámica de contextos de `spaceId` y `groupIds`, solucionando definitivamente la selección global sin recargas manuales.
*   **Aislamiento RLS en SDK**: Creación de `mongoose-rls.ts` con el ayudante `withContextIsolation` en `ABDSatelliteSDK` para dotar a los satélites de filtrado Anti-IDOR automático basado en Espacios y Grupos.
*   **Auditoría y Certificación Total (ERA-11)**: Subsanación profunda de violaciones de linting, tipos `any` genéricos, errores de internacionalización y advertencias del compilador TSC en todos los proyectos (`ABDAuth`, `ABDQuiz`, `ABDLogs` y `ABDtenantGobernance`), logrando conformidad de 100% de calidad.

### Sesión 17: 22 de Mayo de 2026 (Refactorización Estética y Aceptación de la Gobernanza Visual)
*   **Limpieza Técnica (Fire Rules)**: Refactorización masiva en `ABDtenantGobernance` reduciendo archivos monolíticos (como `permissions/page.tsx` de 467 líneas a 183 líneas mediante la abstracción `GroupTreeView` y `PoliciesTable`). Todos los componentes de gobernanza ahora cumplen la norma estricta de `< 150 líneas`.
*   **Internacionalización (i18n)**: Erradicación de literales hardcodeados en los modales de permisos y espacios. Integración robusta de traducciones bajo el namespace `admin.permissions` con `next-intl` en `es.json` y `en.json`.
*   **Validación Estructural**: Compilación y validación de tipos sin errores en el satélite, certificando que el reensamblaje del DOM para el control ABAC mantiene la plena operatividad de la suite bajo la arquitectura *Tech-Noir*.

### Sesión 18: 22 de Mayo de 2026 (Consola de Telemetría y Dashboards Visuales SOC2)
*   **Agregación Analítica (SOC2)**: Implementación de la API de telemetría agregada (`getTelemetryStatsByTenant`) en `ABDLogs` aprovechando el pipeline de agregación de MongoDB.
*   **Visualización Dinámica `Tech-Noir`**: Creación del `TelemetryDashboard` incorporando gráficos interactivos con `recharts` (Flujo Operativo Cronológico en `AreaChart` y Distribución por Satélite en `BarChart`).
*   **Filtros de Ventana de Tiempo**: Implementación de controles de estado para recalcular KPIs dinámicos y telemetría a 7, 15, 30 y 90 días con feedback visual (backdrop-blur y spin loader).
*   **Accesibilidad UX**: Modificación del frontend en `ABDLogs` con botones de acceso rápido desde la vista en vivo de auditoría (`AuditHistoryPanel`) hacia la consola gráfica (`/admin/dashboard`).

### Sesión 19: 22 de Mayo de 2026 (Cadena de Bloques de Auditoría Criptográfica - Hito 5.5)
*   **Inmutabilidad Criptográfica (SHA-256)**: Implementación de encadenamiento por Tenant en `ABDLogs`. Cada nuevo evento auditable captura el hash de su predecesor (`previousHash`), serializa determinísticamente su carga usando `fast-json-stable-stringify`, y calcula un sello hash acumulativo inviolable.
*   **Gestión de Concurrencia y Bifurcaciones**: Adición de un índice único compuesto en Mongoose (`{ tenantId, previousHash }`) para asegurar transaccionalidad y proteger contra *race conditions* sin requerir transacciones completas de MongoDB. Se ha implementado un bucle de reintento exponencial en el ingestor.
*   **Verificación Forense y Panel UI**: Creación del componente reactivo `IntegrityCheckPanel` en la consola de auditoría de `ABDLogs`. Este panel llama a Server Actions para iterar secuencialmente sobre la cadena de bloques, recalculando hashes matemáticos y alertando de cualquier manipulación, rotura o registro fantasma con precisión forense. 
*   **Reset Histórico Seguro**: Ejecución de un purgado de logs legacy vía script (`clear-logs.ts`) para inicializar el bloque génesis de las cadenas bajo la estricta validación del nuevo sistema SOC2.

### Sesión 20: 25 de Mayo de 2026 (Logger Centralizado con PII y Cobertura de Tests Global)
*   **Logger Centralizado en SDK**: Diseñado e implementado el `logger` estructurado central en `@abd/satellite-sdk` con soporte para niveles (`DEBUG`, `INFO`, `WARN`, `ERROR`) y auditorías forenses (`logger.audit`).
*   **Enmascaramiento de PII**: Implementado el algoritmo recursivo `redactPII` que detecta y redacta información sensible (contraseñas, tokens, claves, etc.) y patrones de correos electrónicos y tarjetas de crédito dentro de textos y metadatos dinámicos, manteniendo el correo raíz intacto para trazabilidad forense.
*   **Integración de Satélites**: Refactorizados los archivos `logs-client.ts` de `ABDtenantGobernance`, `ABDQuiz` y `ABDAuth` para delegar automáticamente en el logger del SDK, garantizando el enmascaramiento de PII en todo el ecosistema y resolviendo vulnerabilidades de fugas operativas.
*   **Monitoreo de Cobertura Global**: Configurado `@vitest/coverage-v8` en los 6 proyectos de la suite de forma sincronizada con sus respectivas versiones de `vitest`. Añadidos scripts `"test:coverage": "vitest run --coverage"` y exclusiones personalizadas en cada archivo `vitest.config.ts`, permitiendo la ejecución recursiva paralela.
*   **Verificación Completa**: Ejecutados y aprobados con éxito los 137 tests de la suite con reportes de cobertura limpios y compilaciones de producción exitosas en Next.js/Turbopack.

### Sesión 21: 27 de Mayo de 2026 (Auditoría de Gobernanza Espacial e Infraestructura de Contextos)
*   **Auditoría de Fase 8**: Verificación e identificación del estado de los hitos espaciales transversales.
*   **Selector de Espacios y Grupos**: Actualización de la hoja de ruta para marcar `SpaceSelector` como completado gracias a la integración nativa y reactiva de contextos en `TenantSelector` (`@abd/ecosystem-widgets`).
*   **Redefinición RLS del SDK**: Formalización del desacoplamiento de Mongoose del SDK (`mongoose-rls` removido) delegando el aislamiento anti-IDOR a validaciones de servicio en las aplicaciones satélite.

### Sesión 22: 27 de Mayo de 2026 (Certificación de Linkado Polimórfico - Hito 8.4 / Fase 11)
*   **Modelo e Indexación**: Implementación del modelo Mongoose `AssetSpaceLink` con índice unique compuesto `{ tenantId, assetId, spaceId }`.
*   **Capa de Servicio Transaccional**: Desarrollo de `AssetLinkService` con transacciones atómicas, control de primacía y validación de soberanía de assets.
*   **Propagación en Movimientos**: Ajuste en `SpaceService` para actualizar recursivamente la ruta jerárquica (`spacePath`) sobre los enlaces de assets cuando un espacio cambia de ubicación.
*   **Modal de Gobernanza UI**: Creación del componente `ManageSpaceAssetsModal` en `ABDtenantGobernance` con soporte para vinculación interactiva, detección de enlaces huérfanos ("zombies") y recolección de basura.
*   **Modularización y Certificación**: Extracción de modales de roles (`AssignRoleModal` y `BulkAssignModal`) para reducir el tamaño de `page.tsx` de la app de gobernanza y corrección de atributos de accesibilidad `aria-label` para el validador AST, logrando certificar el pipeline de 6 fases (`0 errors`).

### Sesión 23: 27 de Mayo de 2026 (Revisión de Auditoría y Estado de ABDQuiz / ABDAnalytics)
*   **Auditoría de ABDQuiz**: Se detectó una caída en la certificación de `ABDQuiz` (`SYS_BREACHED`). Se identificaron fallos estructurales (límite de líneas en `examAssignment.ts`, `grading.test.ts`, `AssignmentsList.tsx`), problemas de internacionalización (`CoursesList.tsx`) e incumplimientos de accesibilidad (botones sin labels o posicionamiento incorrecto de `aria-label` en `AssignmentsList.tsx`, `GradingManager.tsx`, `FloatingSelector.tsx` y `QuestionEditorModal.tsx`).
*   **Actualización de ABDAnalytics**: Verificación de la incorporación del microservicio `ABDAnalytics` al ecosistema (`SYS_CERTIFIED`), completando su Fase 3 de visualización de paneles con gráficos de recharts en una vista de 4 pestañas y superando con éxito todas las fases del pipeline.

### Sesión 24: 28 de Mayo de 2026 (Auditoría Global de Documentación)
*   **Detección de Documentación Desactualizada**: Auditoría completa de todos los archivos de documentación del repositorio (20+ archivos).
*   **Hallazgos Críticos**: `ABDLogs/PROGRESS.md` y `ABDLogs/ROADMAP.md` eran copias literales de `ABDtenantGobernance`. No contenían nada específico de `ABDLogs`.
*   **Hallazgos Parciales**: `ABDAuth/ROADMAP.md`, `ABDStyles/ROADMAP.md`, `ABDAnalytics/ROADMAP.md`, `ABDtenantGobernance/ROADMAP.md`, `SECURITY_AUDIT.md` y `navbar_brainstorming.md` tenían referencias a tareas ya completadas o estados desactualizados.
*   **Documentación Corregida (8 archivos)**:
    - `ABDLogs/PROGRESS.md` → Reescribito completo con contenido real del proyecto.
    - `ABDLogs/ROADMAP.md` → Reescribito completo con fases reales de ABDLogs.
    - `ABDAuth/ROADMAP.md` → MFA WebAuthn y Grace Period marcados como completados.
    - `ABDStyles/ROADMAP.md` → Sprints 2-3 movidos a completados.
    - `ABDAnalytics/ROADMAP.md` → Fases 2-3 marcadas como completadas.
    - `ABDtenantGobernance/ROADMAP.md` → Fases 11-12 añadidas.
    - `SECURITY_AUDIT.md` → Referencias a Better Auth actualizadas.
    - `navbar_brainstorming.md` → Nota aclaratoria de implementación completada.

### Sesión 25: 5 de Junio de 2026 (Implementación Core de ABDFiles - Fase 1)
*   **Limpieza de Boilerplate**: Eliminación de modelos y tests heredados de analíticas en `ABDFiles`.
*   **Modelos de Datos Mongoose**: Implementados `Document`, `DocumentVersion`, `DocumentEvent`, `AssetSpaceLink`, `StorageConnector`, `DeletionJob` y `LegalHold` con tipado estricto `type`.
*   **Capa de Servicios**: Creados `StorageService` (Cloudinary signed links) y `DocumentService` (deduplicación intra-tenant y versionado).
*   **Transporte REST API**: Rutas `/api/v1/documents`, `/[assetId]` y `/[assetId]/versions` implementadas.
*   **Compatibilidad y Calidad**: Resueltos tipos de NextRequest en rutas y middlewares, logrando certificar el pipeline de calidad (`SYSTEM CERTIFIED - ERA 11 COMPLIANT`).

### Sesión 26: 5 de Junio de 2026 (Borrado Lógico y Retenciones de ABDFiles - Fase 2)
*   **Capa de Servicios**: Implementada la lógica de `logicalDeleteDocument` y el worker `purgeExpiredDocuments` en `DocumentService` con soporte para bloqueos de `legalHold`.
*   **API y Cron**: Creado el endpoint `DELETE` en la ruta `/api/v1/documents/[assetId]` y el endpoint CRON `/api/cron/data-lifecycle` protegido por token.
*   **Pruebas y Calidad**: Agregados y verificados con éxito 3 nuevos tests unitarios (11 en total). Certificado el pipeline de la suite (`SYSTEM CERTIFIED - ERA 11 COMPLIANT`).

### Sesión 27: 5 de Junio de 2026 (Control de Acceso, Espacios y UI de ABDFiles - Fase 3)
*   **RBAC y Seguridad**: Integrado middleware de autorización para control de accesos basado en roles (`FILE_VIEWER`, `FILE_EDITOR`, `FILE_ADMIN`, `FILE_AUDITOR`).
*   **Gobernanza de Espacios**: Estructurado el mapeo jerárquico por materialized path mediante `AssetSpaceLink` para evitar duplicidad física.
*   **UI Aseptic Retro-Minimalist**: Construcción de paneles interactivos de administración, zona de carga y vista forense detallada en `<DocumentDetailClient />`.

### Sesión 28: 5 de Junio de 2026 (Webhooks, Idempotencia, Concurrencia y Logs - Fase 4)
*   **Webhooks**: Emisión de eventos firmados con HMAC utilizando SHA-256 para validación de origen en receptores satélite.
*   **Idempotencia y Concurrencia**: Control de duplicados en subidas a través de `Idempotency-Key` y control de concurrencia optimista en el incremento de versión.
*   **Auditoría Forense y Logs**: Replicación en tiempo real de logs transaccionales hacia el microservicio forense central `ABDLogs`.
*   **Calidad y Cobertura**: Ampliación de la batería de tests automatizados a 17 pruebas exitosas, logrando la certificación industrial completa (`SYSTEM CERTIFIED - ERA 11 COMPLIANT`).

---

## 🗺️ Roadmap Técnico de ABDFiles (Gestor Documental)

Este roadmap define el desarrollo e integración incremental de **ABDFiles** como el satélite de almacenamiento y versionado inmutable de la suite.

### Fase 1: Core de Almacenamiento, Modelos e Ingesta
*   [x] **1.1 Inicialización y Configuración de Dependencias**: Limpiar los modelos de analíticas heredados en el scaffolding y configurar `@ajabadia/styles`, `@ajabadia/satellite-sdk` y `@ajabadia/ecosystem-widgets`.
*   [x] **1.2 Modelo de Datos MongoDB**: Definir esquemas para `Document`, `DocumentVersion`, `DocumentEvent`, `AssetSpaceLink`, `StorageConnector` y `DeletionJob` utilizando tipado estricto `type`.
*   [x] **1.3 Integración con Cloudinary (Storage Provider)**: Implementar cliente de almacenamiento y URLs firmadas de lectura con expiración corta.
*   [x] **1.4 Servicio de Documentación e Ingesta**: Diseñar `DocumentService` con verificación de cuota por tenant y deduplicación intra-tenant basada en hash SHA-256.
*   [x] **1.5 API Routes de Transporte (v1)**: Implementar endpoints CRUD y carga de versiones de forma síncrona/asíncrona delegando a los servicios correspondientes.

### Fase 2: Borrado Lógico, Ciclos de Retención y Purga
*   [x] **2.1 Ciclo de Vida del Documento**: Implementar transiciones de estado `active` -> `deleted_pending_retention` -> `purge_due` -> `purged`.
*   [x] **2.2 Reglas de Retención por Clase**: Lógica para computar la fecha de purga (`purgeAt`) en función de la clase de retención del documento.
*   [x] **2.3 Worker Periódico (CRON) de Purga**: Tarea CRON `/api/cron/data-lifecycle` para eliminar de forma definitiva los binarios de Cloudinary y actualizar registros a `purged`, gestionando fallos con backoff.

### Fase 3: Roles (RBAC), Espacios Jerárquicos y UI Industrial
*   [x] **3.1 Matriz de Roles y Permisos (RBAC)**: Integrar middleware de autorización para validar `FILE_VIEWER`, `FILE_EDITOR`, `FILE_ADMIN` y `FILE_AUDITOR`.
*   [x] **3.2 Espacios Jerárquicos (Spaces)**: Implementar herencia de rutas con el patrón *Materialized Path* y junction table `AssetSpaceLink` para evitar duplicación física de binarios.
*   [x] **3.3 Bloqueos Legales (Legal Holds)**: Lógica para aplicar y liberar holds que detienen cualquier purga diferida.
*   [x] **3.4 UI Aseptic Retro-Minimalist**: Crear el Dashboard, zona de arrastre (UploadZone), línea temporal de versiones, indicador de cuota y visualizador de eventos de auditoría.

### Fase 4: Webhooks Firmados, Idempotencia y Concurrencia
*   [x] **4.1 Webhooks Externos**: Emisión de eventos firmados con HMAC hacia `docs.abdia.es` y `templates.abdia.es` ante creación, versión o purga de assets.
*   [x] **4.2 Control de Concurrencia y Comandos**: Concurrencia optimista en el incremento de versión de documentos e idempotencia con claves únicas.
*   [x] **4.3 Telemetría en ABDLogs**: Ingestión asíncrona de eventos transaccionales hacia el microservicio forense.

### Fase 5: Escalabilidad y Almacenamiento Dinámico (Parcial)
*   [x] **5.1 Conectores de Almacenamiento (Multi-Provider)**: Implementación del modelo `StorageConnector` y APIs transaccionales para habilitar pools de S3-Compatible / Cloudflare R2 / Cloudinary dinámicos por Tenant.
*   [ ] **5.2 Integración con Event Bus**: Migración de notificaciones síncronas hacia arquitectura orientada a eventos (ej. Kafka/RabbitMQ).
*   [ ] **5.3 Observabilidad y Monitoreo SOC2**: Monitorización de salud de sockets y observabilidad del almacenamiento en caliente.
*   [ ] **5.4 Motor de Búsqueda Integrado**: Indexador Elasticsearch/OpenSearch sobre campos de metadatos y etiquetas.
*   [ ] **5.5 Integración de ABAC Completo**: Enlace completo de todas las operaciones REST a nivel de fila y permisos con el `GuardianEngine`.

### Fase 6: Operaciones Avanzadas e Integridad SOC2 (Futuro)
*   [ ] **6.1 Despliegues de Alta Disponibilidad**: Blue-Green y configuraciones avanzadas de Vercel/PM2.
*   [ ] **6.2 Cifrado Criptográfico a Nivel de Campo (MongoDB)**: Encriptación selectiva de campos sensibles del documento en base de datos.
*   [ ] **6.3 Control y Versionado de Eventos (Event Sourcing)**: Esquema de versionado para el historial de transacciones de storage.

## 📚 Referencias y Grafos Relacionados

* **Especificaciones y Hitos**:
	* [[01_active_specs/STYLE_GUIDE.md]]
	* [[01_active_specs/ESPECIFICACIONES_ABDFILES.md]]
	* [[01_active_specs/ESPECIFICACIONES_DOCUMENTOS.md]]
	* [[01_active_specs/ESPECIFICACIONES_AUTH_EXTERNO_v2.md]]
	* [[01_active_specs/ESPECIFICACIONES_ECOSISTEMA_APRENDIZAJE.md]]
	* [[01_active_specs/ESPECIFICACIONES_ANALYTICS.md]]

* **Diseño y Arquitectura**:
	* [[02_architecture/ANALISIS_ARQUITECTURA.md]]

* **Grafos de Interrelaciones**:
	* [[grafos/Mapa_Global_Suite.md]]
