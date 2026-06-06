# 🗺️ Grafo de Interrelaciones: ABDFiles

Este documento representa el mapa de interrelaciones y dependencias del satélite de almacenamiento de la suite, **ABDFiles**, diseñado para su visualización interactiva y navegación en **Obsidian** (Graph View) mediante enlaces de notas dobles (`[[WikiLinks]]`).

---

## 🏗️ Núcleo de Entrada y Rutas

### 🛰️ Proxy y Layout
* [[src/proxy.ts]]
	* Importa la autenticación federada del SDK: `[[@ajabadia/satellite-sdk]]`
	* Protege las rutas satélites aplicando el middleware del locale unificado.
* [[src/app/layout.tsx]]
	* Renderiza la configuración global del layout.
* [[src/app/[locale]/layout.tsx]]
	* Carga el sistema i18n (`next-intl`) de `[[src/i18n/routing.ts]]`.
	* Inyecta la personalización de marca con `[[BrandingStyles]]` del SDK.
	* Configura el `[[SessionProvider]]` del cliente.
* [[src/app/[locale]/logout-success/page.tsx]]
	* Renderiza la pantalla unificada de despedida delegando en el widget `[[ABDEcosystemWidgets|LogoutSuccessView]]`.

### 🛣️ Endpoints API REST (V1)
* [[src/app/api/v1/documents/route.ts]]
	* Maneja la subida `POST` e indexación `GET` de assets.
	* Depende del motor de políticas `[[src/lib/abac.ts]]` y el servicio transaccional `[[src/services/document-service.ts]]`.
	* Valida contra ataques duplicados con `[[src/lib/idempotency.ts]]`.
* [[src/app/api/v1/documents/[assetId]/route.ts]]
	* Lee y borra lógicamente documentos específicos.
* [[src/app/api/v1/documents/[assetId]/versions/route.ts]]
	* Gestiona el versionado inmutable e incremental de los archivos subidos.
* [[src/app/api/v1/documents/[assetId]/holds/route.ts]]
	* Aplica bloqueos legales (`LegalHold`) que previenen borrados accidentales de evidencias.
* [[src/app/api/v1/connectors/route.ts]]
	* Configura conectores externos de storage (`StorageConnector`).

---

## 🛠️ Capa de Servicios y Lógica de Negocio

* [[src/services/document-service.ts]]
	* Orquesta el ciclo de vida del documento (`uploadDocument`, `logicalDeleteDocument`, `purgeExpiredDocuments`).
	* Enlaza assets a espacios jerárquicos usando `[[src/services/space-link-service.ts]]`.
	* Aplica mitigaciones de retención consultando `[[src/services/legal-hold-service.ts]]`.
	* Réplica telemetría y logs forenses mediante `[[src/services/integration-logs-service.ts]]`.
	* Emite notificaciones HMAC seguras usando `[[src/services/webhook-service.ts]]`.
	* Interactúa con los modelos Mongoose:
		* `[[src/models/Document.ts]]`
		* `[[src/models/DocumentVersion.ts]]`
		* `[[src/models/DocumentEvent.ts]]`
		* `[[src/models/DeletionJob.ts]]`

* [[src/services/storage-service.ts]]
	* Resuelve el almacenamiento físico hacia proveedores como Cloudinary o Amazon S3 empleando `[[src/services/storage/storage-providers.ts]]`.
	* Lee configuraciones de base de datos con `[[src/models/StorageConnector.ts]]`.

---

## 📦 Modelos de Datos (Mongoose)

* [[src/models/Document.ts]]
	* Representa el asset lógico (metadata principal, nivel de sensibilidad, clase de retención).
* [[src/models/DocumentVersion.ts]]
	* Registro inmutable de cada versión física subida con su respectivo hash SHA-256 (`latestHash`).
* [[src/models/AssetSpaceLink.ts]]
	* Tabla intermedia Many-to-Many para vincular assets a la jerarquía de espacios (`spaceId`).
* [[src/models/DeletionJob.ts]]
	* Trabajos cron asíncronos programados para depurar físicamente archivos vencidos.
* [[src/models/LegalHold.ts]]
	* Registro de bloqueos/retenciones legales activas.
* [[src/models/StorageConnector.ts]]
	* Parámetros de conexión cifrados a AWS S3 / Cloudflare R2 / Cloudinary.
* [[src/models/IdempotencyKey.ts]]
	* Cache de solicitudes API procesadas para mitigar reenvíos de red duplicados.

---

## 🎨 Componentes Visuales e Interfaces

* [[src/components/admin/DocumentDetailClient.tsx]]
	* Panel interactivo de administración y visor forense de logs y versiones del documento.
* [[src/components/admin/UploadZone.tsx]]
	* Zona de carga interactiva premium con control de drag-and-drop y visualización de progreso.
* [[src/components/layout/SidebarNavigation.tsx]]
	* Barra táctil lateral para navegación con conmutación dinámica del locale.
* [[src/components/ui/TenantSelector.tsx]]
	* Inyección del widget selector de inquilino/espacio de la suite.

---

## 🔐 Seguridad y Gobernanza

* [[src/lib/abac.ts]]
	* Invoca a `evaluateAccess` del SDK para contrastar permisos contra el `GuardianEngine` del Control Plane de Gobernanza.
* [[src/lib/idempotency.ts]]
	* Middleware en el endpoint de subidas que previene uploads duplicados a través de `[[src/models/IdempotencyKey.ts]]`.

---

## 📚 Documentación de Especificaciones y Diseño

* **Especificaciones Activas**:
	* [[01_active_specs/ESPECIFICACIONES_ABDFILES.md]] (Requerimientos, almacenamiento, conectores y retenciones).
	* [[01_active_specs/ESPECIFICACIONES_DOCUMENTOS.md]] (Definición del ciclo de vida y metadatos de documentos).
	* [[01_active_specs/ROADMAP.md]] (Hitos de desarrollo e integraciones).
* **Desarrollo y PDFs (Desarrollos Suite)**:
	* [[Desarrollos Suite/ABDDocs & ABDTemplates.md]] (Plantillas y generación de PDFs).
	* [[Desarrollos Suite/plan_arquitectura_pdf_suite_abd_v2.md]] (Arquitectura de generación PDF).
	* [[Desarrollos Suite/anexo_tecnico_pdf_accessible_pipeline.md]] (Accesibilidad de PDFs).
* **Historial y Archivo**:
	* [[03_archive/PROMPT_2_APLICACIONES.md]] (Instrucciones originales para los satélites de almacenamiento).
