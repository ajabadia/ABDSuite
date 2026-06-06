# Especificaciones y Plan de Implementación: Capacidad Documental de ABDSuite (v4.0 - Era 6.1)

## 1. Objetivo y Visión General
Este documento define la incorporación de la nueva capacidad de gestión documental, procesamiento de PDFs y control de plantillas en la suite **ABDSuite**. La suite está estructurada como un ecosistema de aplicaciones satélites distribuidas, conectadas por servicios comunes, autenticación federada, trazabilidad centralizada y un estricto aislamiento multi-tenant.

La nueva capacidad se integra como una extensión coherente de la plataforma basada en subdominios independientes, componentes compartidos y trazabilidad homogénea, eliminando duplicidades y clarificando las fronteras entre procesamiento cliente y backend.

---

## 2. Conclusión Arquitectónica (Estructura de Tres Satélites)
Se establece la creación de **tres aplicaciones satélites nuevas**, separando las responsabilidades por dominio de negocio (almacenamiento, procesamiento y gobernanza):

1.  **Document Manager (`documents.abdia.es`)**: Satélite canónico de almacenamiento (alias secundario: `files.abdia.es`). Responsable del almacenamiento, versionado, recuperación y publicación de documentos PDF de la suite. Actúa como fuente de verdad del binario documental y expone referencias lógicas estables (`assetRef`).
2.  **docs.abdia.es**: Satélite de procesamiento y extracción. Su responsabilidad es operar sobre las referencias `assetRef` sin asumir la persistencia del almacenamiento primario del binario.
3.  **templates.abdia.es**: Satélite de diseño, aprobación, gobernanza de plantillas y orquestación de la generación de documentos (PDF e emails). Puede producir nuevos assets, pero delega el almacenamiento primario al Document Manager.

---

## 3. Aplicación 1: Document Manager (`documents.abdia.es`)

> 📄 **Especificación técnica completa**: La arquitectura detallada, modelo de datos, API, pseudocódigo, RBAC, webhooks, UI y roadmap de implementación del gestor documental se encuentran en [ESPECIFICACIONES_ABDFILES.md](./ESPECIFICACIONES_ABDFILES.md). Esta sección mantiene el resumen ejecutivo y las reglas de integración con el ecosistema.

### Responsabilidad Principal
Centralizar el almacenamiento, versionado, recuperación y publicación de documentos PDF de la suite, abstrayendo el backend físico de storage por tenant.

### Funciones Incluidas
*   Alta de documentos PDF subidos por usuarios o generados por templates.
*   Versionado de binarios y conservación de historial de cambios.
*   Integración con **Cloudinary** como proveedor de almacenamiento base por defecto.
*   Soporte para conectores alternativos por tenant hacia repositorios de almacenamiento externos.
*   Resolución de permisos de acceso a nivel de asset.
*   Emisión de eventos de auditoría inmutables hacia **ABDLogs**.

### Control de Cuota, Segregación y Tracking (Cloudinary Adapter Patterns)
Heredando la lógica de backend probada en la plataforma `ABDAgRAG`, el módulo Document Manager implementa las siguientes reglas de almacenamiento:
1.  **Verificación de Cuota**: Antes de iniciar cualquier streaming de subida, se validará mediante `TenantQuotaService.hasStorageQuota(tenantId, size)` que el inquilino no supere su límite asignado de almacenamiento.
2.  **Segregación Física por Prefijo**: Para aislar los archivos de cada organización en el bucket compartido, la ruta de persistencia se prefijará dinámicamente llamando a `TenantQuotaService.getCloudinaryPrefix(tenantId)` (ej. `prefix/tenants/{tenantId}/documentos-rag`).
3.  **Tracking de Uso para Analytics**: Cada alta o eliminación exitosa reportará el peso del binario mediante `UsageService.trackStorage(tenantId, size, type)` para alimentar las alertas de consumo e informes de facturación en **ABDAnalytics**.
4.  **Enlaces Firmados Seguros (Signed URLs)**: El gestor documental bloqueará el acceso público directo a los archivos en producción. Generará URLs firmadas temporalmente (`sign_url: true`) para descargas y consumos internos del pipeline de OCR y renderizado.

### Tarea de Mantenimiento y Retención (Cleanup Worker)
*   **Acción**: Ejecución de una tarea CRON periódica (`/api/cron/data-lifecycle`) para garantizar el cumplimiento de normativas de retención y optimización de costes.
*   **Reglas de Purga**:
    1.  **Archivos Temporales**: Eliminación física de archivos en estado temporal o de previsualización tras 7 días.
    2.  **Drafts Huérfanos**: Purga automática de documentos en estado `UPLOADED` por más de 24 horas sin haber iniciado el procesamiento o OCR.

### Contrato de Conectores de Almacenamiento
*   **`StorageProvider`**: `cloudinary | tenantRepository | s3Compatible | customConnector`
*   **`ConnectorProfile`**:
    *   `connectorId`
    *   `tenantId`
    *   `providerType` (StorageProvider)
    *   `status` (`active | inactive`)
    *   `credentialsRef`
    *   `allowedScopes`
    *   `retentionPolicy`
    *   `auditMode`
*   **Reglas**:
    *   Cloudinary será el proveedor base por defecto.
    *   Un tenant podrá registrar uno o más conectores externos si la política de gobernanza lo permite.
    *   El routing hacia el proveedor correcto se resolverá por `tenantId`, `documentType` y `operationType`.
    *   Todo cambio de conector o de política de almacenamiento debe quedar auditado en **ABDLogs**.

---

## 4. Definición del Contrato Central (`assetRef`)

Para evitar acoplamientos rígidos entre los satélites, toda interacción entre el almacenamiento, procesamiento y renderizado se realiza mediante el contrato lógico de **`assetRef`**:

`assetRef` es el identificador lógico compuesto que representa un documento dentro de ABDSuite. Contiene la referencia estable al activo, su contexto de tenant, su versión lógica, su huella criptográfica y la referencia física de storage, y es el único contrato que consumen `docs.abdia.es` y `templates.abdia.es` para operar sobre documentos sin acceder directamente al almacenamiento primario.

---

## 5. Deduplicación y Gestión de Binarios

El Document Manager implementa una capa formal de deduplicación de assets basada en la huella criptográfica del binario, estructurada bajo una ruta evolutiva clara para garantizar la consistencia, rendimiento y seguridad multi-tenant:

### A. Modelo Base de Deduplicación
El sistema opera a nivel de archivo completo mediante un modelo de referencia lógica basado en hash e incremento atómico de referencias (`refCount`):
*   **Flujo**:
    1.  Al recibir un archivo, se calcula su huella criptográfica.
    2.  Si ya existe un asset con la misma huella, la misma política de aislamiento y dentro del namespace del inquilino, se incrementa `refCount` y se reutiliza el `storageRef` existente asociado a la referencia `assetRef`.
    3.  Si no existe, se persiste el binario físico en el proveedor de almacenamiento y se crea una nueva entrada de asset.
    4.  Al desvincular un documento, se decrementa `refCount`.
    5.  Un proceso de Garbage Collection en segundo plano elimina los binarios físicos y los registros huérfanos cuando `refCount = 0`.

### B. Ruta de Evolución por Fases (Grado Industrial)
El modelo básico transicionará de forma incremental hacia una arquitectura distribuida:
*   **Fase 1: Deduplicación Básica por Archivo**: Por archivo completo utilizando hash criptográfico robusto (SHA-256) restringido estrictamente al namespace y políticas de aislamiento del tenant (MVP).
*   **Fase 2: Deduplicación por Bloques**: Segmentación de archivos grandes en bloques de tamaño fijo o variable (Rabin Fingerprints) para reutilizar fragmentos repetidos entre archivos distintos, optimizando el storage incremental.
*   **Fase 3: Deduplicación Semántica**: Reutilización controlada de embeddings vectoriales, tokens indexados y metadatos derivados de textos idénticos en OCR e inteligencia documental sin duplicar procesamiento.

### C. Política de Aislamiento y Resolución de Identidad
*   **Frontera de Seguridad**: Toda comprobación de deduplicación debe resolverse dentro del perímetro de seguridad del tenant. Los índices globales, si existen, deben estar salados o segmentados por inquilino y nunca exponer respuestas observables que permitan confirmar la existencia de un binario ajeno (prohibición de canal lateral de comprobación de existencia).
*   **Identidad Unificada**: La identidad del archivo en la base de datos se compondrá de:
    `assetFingerprint + tenantScope + storagePolicy`
    Esto garantiza que las diferencias en almacenamiento o seguridad eviten la compartición accidental de binarios.

### D. Trazabilidad Forense
Los eventos de deduplicación se reportarán a `ABDLogs` detallando huellas de hash, tenant, operación y proveedor de storage, pero **nunca** guardarán el contenido o texto del binario en el log de auditoría.

### E. Decisión de Arquitectura Cliente-Servidor
Dado que `docs.abdia.es` adopta una filosofía preferentemente offline-first para manipulación local, la decisión final de deduplicación de binarios ("fuente de verdad") debe residir en el backend de **Document Manager** y no en el cliente. El cliente se limitará a pre-calcular los hashes y validar metadatos locales, pero el backend del gestor resolverá las colisiones autorizadas con contexto de tenant.

---

## 6. Estructura y Particionamiento Jerárquico en Espacios (Spaces)

Para evitar la duplicación física de archivos en Cloudinary y dar soporte a estructuras organizativas complejas y dinámicas (inquilinos, departamentos, grupos o usuarios privados), la plataforma adopta el modelo de **Espacios (Spaces)** heredado de `ABDAgRAG`:

### A. Tipos de Espacio y Ámbitos de Aislamiento
Los documentos se asignan a entornos lógicos con distintos alcances:
*   **`GLOBAL`**: Contenido maestro de la plataforma (ej. plantillas comunes o manuales de referencia globales). Aislado para lectura.
*   **`INDUSTRY`**: Segmentado por sector industrial. Solo accesible si el tenant tiene la licencia activa para dicho sector.
*   **`TENANT`**: El espacio base de cada organización inquilina.
*   **`TEAM`**: Sub-espacios restringidos a departamentos, equipos o grupos específicos.
*   **`PERSONAL`**: Espacios de uso exclusivo del operador creador.

### B. Rutas Materializadas (Materialized Path)
La jerarquía se almacena en base de datos utilizando el patrón **Materialized Path** (`materializedPath`, ej. `/global/industrial/motores/calibracion`). 
*   **Sincronización en Cascada**: Al mover un espacio dentro del árbol de directorios lógicos, el servicio `SpaceService.moveSpace` ejecuta una actualización recursiva del path de los hijos y propaga automáticamente el cambio a los registros de `KnowledgeAssets`, `DocumentChunks` y `AssetSpaceLinks` en una sola operación transaccional.

### C. Enlaces de Asset y Espacios Múltiples sin Duplicación (`AssetSpaceLink`)
*   Para evitar subir dos veces el mismo binario cuando se requiere su disponibilidad en distintos ámbitos lógicos (ej. un manual de seguridad que debe verse tanto en `/departamento-tecnico` como en `/onboarding-nuevos`), los assets se desacoplan de los espacios:
    *   Los espacios son particiones puramente lógicas.
    *   Los enlaces `AssetSpaceLink` son registros de relación ligeros.
    *   El binario no se duplica ni se altera en el storage físico al mover un asset entre espacios lógicos o agregarlo a múltiples directorios.

### D. Colaboradores y Permisos de Acceso (Matriz ABAC)
Los accesos se rigen por:
1.  **Visibilidad del Espacio**: `PUBLIC | INTERNAL | PRIVATE | RESTRICTED`.
2.  **Lista de Colaboradores**: Un array de usuarios invitados al espacio con roles específicos (`VIEWER | EDITOR | ADMIN`), validado por `SpaceService.getAccessibleSpaces` cruzando permisos con las limitaciones del plan del tenant (`LimitsService`).

---

## 7. Aplicación 2: `docs.abdia.es` (Procesamiento de Documentos)

### Responsabilidad Principal
Procesar documentos existentes a partir de referencias `assetRef` obtenidas del Document Manager, ejecutando flujos de OCR, limpieza o manipulación en un entorno de confianza cero. Esta aplicación no actúa como repositorio de persistencia documental primaria.

### Funciones Incluidas
*   **Extracción de texto**: Extraer contenido de PDFs con capa de texto activa.
*   **OCR Integrado**: Ejecución de OCR local para escaneos o imágenes de texto.
*   **Pipeline de Limpieza Fuerte**: Normalización, unión de líneas, colapsado de espacios, limpieza de guiones y reconstrucción estructural de párrafos.
*   **Filtro Semántico por Marcadores (Trimming lógico)**: Permite delimitar el texto extraído mediante tokens de inicio y fin (ej. "empieza en `Capítulo 3`" y "detener en `Capítulo 4`"), evitando ingestar ruido de páginas adyacentes al RAG.
*   **Manipulación de páginas**: Unir (merge), dividir (split), reordenar, rotar y recortar rangos de páginas.
*   **Derivados**: Generación de texto limpio, texto bruto, metadatos estructurados, miniaturas visuales y hashes de integridad.

---

## 8. Aplicación 3: `templates.abdia.es` (Gobernanza de Plantillas)

### Responsabilidad Principal
Gobernar plantillas reutilizables y orquestar la generación de documentos y correos por tenant, grupo, departamento y usuario. No asume la propiedad del almacenamiento del binario resultante.

### Gobernanza de Plantillas
*   **Plantillas PDF (Layouts Dinámicos por Secciones)**: Las plantillas PDF avanzadas se estructuran mediante una colección de Secciones Estructuradas (`sections` de tipos `TEXT | METRICS_GRID | DATA_TABLE | LIST`) que definen propiedades de maquetación (`columns`, `breakPageBefore`, `compact`) mapeadas dinámicamente al JSON de entrada mediante `dataSource` / `dataKey`.
*   **Plantillas de Email (Handlebars + Dynamic Branding)**: Notificaciones estructuradas con asunto (`subjectTemplates`) y cuerpo HTML (`bodyHtmlTemplates`) multilingüe compiladas en backend mediante **Handlebars** (`Handlebars.compile`), inyectando automáticamente la marca corporativa del inquilino (`company_name`, `branding_logo`, colores HSL) y la variable especial `{{tenant_custom_note}}`.
*   **Gobernanza Dinámica de Prompts de IA**: Almacenamiento dinámico en base de datos (`prompts` y `prompt_versions`) consumidos en caliente para evitar redespliegues en los satélites.
*   **Branding Declarativo Seguro**: Temas tipográficos e HSL parametrizados mediante JSON para evitar la inyección de estilos o scripts maliciosos.
*   **Orquestación de Motores (Rendering Orchestrator)**: Routing inteligente de renderizado:
    *   *Generación Simple*: Rápida para documentos planos (facturas, notificaciones) sin accesibilidad.
    *   *Generación Avanzada*: Requerido obligatoriamente si `accessibilityProfile = accessible-pdf`.
*   **I18N Layers**: Separación de layout físico y catálogo de traducciones localizado resuelto de forma jerárquica.

---

## 9. Política de Sincronización de Datos (Data Sync Rules)

Para delimitar rigurosamente las operaciones locales (Offline-First) de la persistencia autorizada en servidor, se establece el siguiente contrato técnico de datos:

| Categoría de Sincronización | Ejemplos de Datos | Ubicación y Política de Transporte |
| :--- | :--- | :--- |
| **1. Nunca Sincronizable** | Binarios fuente de verdad (PDFs originales), imágenes escaneadas de entrada, blobs temporales de trabajo. | Permanecen localmente en el cliente o se transmiten exclusivamente por endpoints cifrados al Document Manager. Nunca se replican a otros satélites. |
| **2. Solo Local Cifrado** | `rawText` y `cleanText` procedentes de extracción/OCR local en cliente, buffers intermedios de páginas. | Almacenados exclusivamente en el Dexie.js local con blindaje criptográfico AES-GCM-256 at-rest. Se purgan de la memoria al finalizar el job. |
| **3. Sincronizable por Defecto** | Metadatos técnicos (`fileHash`, `pagesCount`), estados de jobs, definiciones de plantillas y layouts, logs de auditoría. | Sincronizados y persistidos en el clúster central (MongoDB) y reportados hacia `ABDLogs` para trazabilidad de gobernanza. |
| **4. Sincronizable bajo Política** | Fragmentos de texto procesado recuperables o citas estructurales para motores de búsqueda RAG corporativos. | Solo se replican hacia el clúster si el tenant firma una política explícita de "Cloud Search / RAG habilitado" y el transporte implementa cifrado a nivel de aplicación. |

---

## 10. Validación de PDFs: WCAG, PDF/UA y PDF/A
La validación de la accesibilidad y durabilidad documental debe cubrir múltiples estándares integrados en el pipeline técnico:

### A. WCAG (Web Content Accessibility Guidelines) aplicado a PDF
Asegura criterios funcionales de navegación, contraste y lectura lógica del contenido del documento.

### B. PDF/UA (ISO 14289 - Universal Accessibility)
Garantiza que la estructura técnica interna del archivo sea compatible con tecnologías de asistencia (Tagged PDF, logical structure tree, role mapping, marcado de figuras, declaración de idioma principal, fuentes embebidas y bookmarks en documentos largos).

### C. PDF/A (ISO 19005 - Archiving)
Orientado a la preservación del documento a largo plazo. 
*   **Regla de Negocio**: Si un tenant requiere preservación y accesibilidad, el flujo de salida generará una conformidad **PDF/UA + PDF/A** combinada. PDF/A de forma aislada no sustituye la accesibilidad (un PDF/A puede seguir siendo inaccesible).

### Flujo de Estados del Ciclo de Validación
`generated` ➔ `auto_validated` ➔ `manual_review_pending` ➔ `certified_accessible` o `rejected`

---

## 11. Modelo de Datos Técnico (MongoDB & Dexie Stores)

### 1. Colección/Store `documents`
*   `recordId` (Branded UUIDv4)
*   `tenantId`
*   `departmentId?`
*   `groupIds[]`
*   `ownerUserId` (OperatorId)
*   `filename`
*   `mimeType`
*   `pagesCount`
*   `fileHash` (SHA-256)
*   `rawText` (Solo local en IndexedDB si el perfil es de alta sensibilidad)
*   `cleanText` (Solo local en IndexedDB si el perfil es de alta sensibilidad)
*   `ocrUsed` (Boolean)
*   `processingStatus` (`pending | processing | completed | failed`)
*   `createdAt`
*   `updatedAt`

### 2. Colección/Store `document_jobs`
*   `jobId` (UUIDv4)
*   `tenantId`
*   `documentId`
*   `jobType` (`extract | ocr | clean | split | merge | reorder`)
*   `status` (`queued | processing | completed | failed`)
*   `requestedBy`
*   `startedAt`
*   `finishedAt`
*   `errorMessage?`

### 3. Colección/Store `templates`
*   `templateId` (UUIDv4)
*   `tenantId`
*   `channel` (`pdf | email`)
*   `scopeType` (`tenant | department | group | user`)
*   `scopeId`
*   `name`
*   `slug`
*   `schemaVersion`
*   `status` (`draft | review | published | archived`)
*   `renderMode` (`simple | advanced`)
*   `accessibilityProfile` (`none | basic | accessible-pdf`)
*   `currentVersionId`
*   `brandKitId`
*   `createdBy`
*   `updatedBy`
*   `publishedAt`

### 4. Colección/Store `template_versions`
*   `tenantId`
*   `templateId`
*   `version` (String)
*   `schema` (Object)
*   `renderConfig` (Object)
*   `messagesVersionRef` (String)
*   `brandKitVersionRef` (String)
*   `changeSummary` (String)
*   `createdBy`
*   `createdAt`

### 5. Colección/Store `template_publications`
*   `publicationId` (UUIDv4)
*   `tenantId`
*   `templateId`
*   `templateVersionId`
*   `environment` (String)
*   `publishedBy`
*   `publishedAt`

### 6. Colección/Store `prompts` (Dynamic System Prompts)
*   `promptId` (UUIDv4)
*   `tenantId` (o `SYSTEM` para globales)
*   `name` (String)
*   `slug` (String, ej: `ocr-extraction-cleanup`)
*   `description?` (String)
*   `activeVersionId` (ObjectId)
*   `createdAt`
*   `updatedAt`

### 7. Colección/Store `prompt_versions`
*   `promptId` (UUIDv4)
*   `version` (String)
*   `promptText` (String)
*   `changeSummary` (String)
*   `createdBy` (OperatorId)
*   `createdAt`

### 8. Colección/Store `spaces` (Hierarchical Knowledge Partitioning)
*   `spaceId` (UUIDv4)
*   `tenantId` (o `abd_global` para GLOBAL/INDUSTRY)
*   `name` (String)
*   `slug` (String)
*   `description?` (String)
*   `type` (`GLOBAL | INDUSTRY | TENANT | TEAM | PERSONAL`)
*   `industry?` (String, obligatorio para tipo INDUSTRY)
*   `ownerUserId?` (UUID, para tipo PERSONAL)
*   `collaborators` (Array of Object: `userId` (UUID), `role` (`VIEWER | EDITOR | ADMIN`), `joinedAt` (Date))
*   `parentSpaceId?` (UUID)
*   `materializedPath` (String, ej: `/global/industrial/motores`)
*   `visibility` (`PUBLIC | INTERNAL | PRIVATE | RESTRICTED`)
*   `monetized` (Boolean)
*   `subscriptionRequired?` (String, ej: plan tier 'GOLD')
*   `config` (Object: `icon`, `color`, `isDefault`, `allowQuickQA`)
*   `isActive` (Boolean)
*   `createdAt`
*   `updatedAt`

### 9. Colección/Store `asset_space_links` (Junction table to prevent binary duplication)
*   `linkId` (UUIDv4)
*   `tenantId`
*   `assetId` (UUID, referencia al archivo primario)
*   `spaceId` (UUID, referencia al espacio destino)
*   `spacePath` (String, copia denormalizada para listados jerárquicos veloces)
*   `isPrimary` (Boolean, indica si es el espacio raíz del archivo)
*   `createdAt`
*   `createdBy?`

---

## 12. Contratos de Código (Interfaces TypeScript)

### Interfaz del Orquestador de Render
```typescript
export interface PdfRenderer {
  render(input: PdfRenderInput): Promise<PdfRenderResult>;
}

export interface PdfRenderInput {
  tenantId: string;
  templateId: string;
  templateVersionId: string;
  locale: string;
  data: Record<string, unknown>;
  renderMode: 'simple' | 'advanced';
  accessibilityProfile: 'none' | 'basic' | 'accessible-pdf';
}

export interface PdfRenderResult {
  storageRef: string;
  outputPdfHash: string;
  pageCount: number;
  metadata: Record<string, unknown>;
}
```

### Interfaz del Validador de Accesibilidad PDF
```typescript
export interface PdfAccessibilityValidator {
  validate(input: PdfValidationInput): Promise<PdfValidationResult>;
}

export interface PdfValidationInput {
  tenantId: string;
  documentId: string;
  storageRef: string;
  standardTargets: Array<'WCAG-PDF' | 'PDF-UA' | 'PDF-A'>;
}

export interface PdfValidationResult {
  passed: boolean;
  score?: number;
  issues: Array<{
    code: string;
    severity: 'info' | 'warning' | 'error';
    message: string;
  }>;
  reportRef?: string;
}
```

---

## 13. Estructura de Archivos (Clean Architecture Layout)

### Estructura de `templates.abdia.es`
```text
src/
  app/
    [locale]/
      dashboard/
        templates/
          page.tsx
          [templateId]/
            page.tsx
            versions/
              page.tsx
            publish/
              page.tsx
        documents/
          page.tsx
          validations/
            page.tsx
  components/
    templates/
      TemplateList.tsx
      TemplateEditor.tsx
      TemplateVersionHistory.tsx
      TemplatePublishDialog.tsx
    documents/
      DocumentValidationPanel.tsx
      AccessibilityReportCard.tsx
  features/
    templates/
      domain/
        entities/
          Template.ts
          TemplateVersion.ts
          TemplatePublication.ts
        value-objects/
          RenderMode.ts
          AccessibilityProfile.ts
      application/
        services/
          create-template.service.ts
          publish-template.service.ts
      infrastructure/
        repositories/
          mongo-template.repository.ts
    rendering/
      infrastructure/
        renderers/
          simple/
            simple-pdf-renderer.ts
          advanced/
            advanced-pdf-renderer.ts
    validation/
      infrastructure/
        checkers/
          pdfua-checker.adapter.ts
          wcag-pdf-checker.adapter.ts
          manual-review.adapter.ts
```

### Estructura de `docs.abdia.es`
```text
src/
  app/
    [locale]/
      dashboard/
        docs/
          page.tsx
          [documentId]/
            page.tsx
            text/
              page.tsx
            pages/
              page.tsx
  features/
    documents/
      application/
        services/
          extract-text.service.ts
          run-ocr.service.ts
          clean-text.service.ts
      infrastructure/
        extractors/
          scribe-text-extractor.adapter.ts
        pdf/
          pdf-lib-page-ops.adapter.ts
```

---

## 14. Requisitos Transversales y Consistencia Visual (Style Guide)

El desarrollo técnico debe heredar e integrar estrictamente los paquetes centralizados definidos en el scope `@ajabadia/` del proyecto principal:

1. **Dependencias del Core**:
   * `@ajabadia/styles` (Gestión centralizada de tokens, tipografía e `industrial-core.css`).
   * `@ajabadia/satellite-sdk` (SSO, sesión federada, JWT proxy y Zero-FOUC branding).
   * `@ajabadia/ecosystem-widgets` (Contiene `SmartNavbar`, `CommandPalette` y componentes de control comunes).

2. **Wrapper de Navegación**:
   * Queda prohibido importar directamente `SmartNavbar` en el layout de Next.js. El satélite implementará un wrapper local obligatorio `SidebarNavigation` para inyectar enlaces del satélite y configurar `appBadge="DOCS"`.

3. **Inyección de Branding (Zero-FOUC)**:
   * El layout raíz del proyecto debe incluir el componente servidor `<BrandingStyles />` importado de `@ajabadia/satellite-sdk` dentro de la etiqueta `<head>` para cargar la identidad del subdominio de forma síncrona en el servidor.

4. **Calidad y Linter**:
   * Ejecución obligatoria de la herramienta local de certificación de calidad `scripts/abd-audit.ps1` (o `pnpm run full-audit`) antes de cualquier confirmación de cambios.

5. **Reglas FIRE**:
   * **`FIRE:MAX_LINES`**: Ningún componente o archivo de código de UI debe superar las **150 líneas**.
   * **`FIRE:I18N_VIOLATION`**: Queda prohibido incluir cadenas de texto crudas (hardcoded strings) en JSX. Uso obligatorio de `next-intl`.
   * **`FIRE:A11Y_VIOLATION`**: `aria-label` obligatorio en botones icon-only y descripción `alt` en etiquetas `<img>`.

---

## 15. Autenticación, Autorización e Integridad Referencial (Satellite IAM & Cross-Cluster Rules)

*   **SSO / ABDAuth**: Los satélites validan los claims y el tenant activo resolviendo el JWT firmado a través del middleware/proxy de `@ajabadia/satellite-sdk`.
*   **Autorización Vinculante**: Toda acción sensible sobre recursos debe validarse en middleware (`withIndustrialAuth`), Server Actions, Route Handlers o servicios backend del satélite utilizando los claims del JWT de la sesión obtenidos con `getIndustrialSession()` o `ensureIndustrialAccess()`, y cuando aplique, el motor de autorización compartido de Gobernanza (Guardian).
*   **UI Adaptativa**: La interfaz puede consumir permisos efectivos para mostrar u ocultar acciones en la UI, pero esta visibilidad nunca sustituye la validación de backend.
*   **Regla de Integridad Referencial Cross-Cluster**:
    *   Al guardar entidades documentales en el clúster operativo `MAIN`, la capa de repositorio (ej. `MongoDocumentRepository`) validará la existencia física de claves foráneas contra otros clústeres del ecosistema:
        *   `ownerUserId` debe ser validado contra `AUTH.users`.
        *   `documentTypeId` debe ser validado contra `CONFIG.document_types`.
    *   La infraestructura expondrá una función de validación inyectando el target clúster (`validateExists(id, targetCluster)`) similar a la implementada en `ABDAgRAG`.

---

## 16. Logs y Trazabilidad (Pipeline de Auditoría Central - Grado Bancario)

Toda acción técnica relevante debe reportar sus logs de ejecución a través del pipeline de auditoría central de la suite, garantizando el envío seguro de eventos a **ABDLogs** mediante los adaptadores del SDK para su posterior consumo de solo lectura en **ABDAnalytics**:

### Estructura de Evento de Auditoría
El payload enviado a `ABDLogs` debe contener como mínimo:
*   `tenantId`
*   `actorId`
*   `app` (ej. `DOCS_MANAGER | DOCS_PARSER | TEMPLATES_GOV`)
*   `action` (Eventos obligatorios listados abajo)
*   `entityType` (`document | template | publication | connector`)
*   `entityId` (UUID de la entidad)
*   `assetHash` (Hash del binario actual)
*   `beforeHash` (Hash del binario anterior en modificaciones)
*   `afterHash` (Hash del binario resultante)
*   `storageProvider` (`cloudinary | customConnector`)
*   `connectorId`
*   `timestamp`
*   `result` (`success | failure`)
*   `correlationId` (ID único de sesión correlativo para trazar la operación de extremo a extremo)

### Catálogo de Eventos a Auditar
*   `DOCUMENT_ASSET_CREATED`
*   `DOCUMENT_ASSET_UPDATED`
*   `DOCUMENT_ASSET_MOVED`
*   `DOCUMENT_ASSET_DELETED`
*   `DOCUMENT_CONNECTOR_CHANGED`
*   `DOCUMENT_UPLOADED`
*   `DOCUMENT_EXTRACTED`
*   `DOCUMENT_OCR_COMPLETED`
*   `DOCUMENT_PAGES_REORDERED`
*   `DOCUMENT_RENDER_REQUESTED`
*   `DOCUMENT_RENDER_COMPLETED`
*   `DOCUMENT_RENDER_FAILED`
*   `DOCUMENT_VALIDATION_PASSED`
*   `DOCUMENT_VALIDATION_FAILED`

---

## 17. Flujo Operativo de Extremo a Extremo
1.  El usuario sube un PDF al **Document Manager**.
2.  El binario se almacena físicamente en Cloudinary o en el conector del tenant y se genera su referencia `assetRef`.
3.  El sistema calcula el hash del binario de entrada e inyecta el `DOCUMENT_ASSET_CREATED` en **ABDLogs**.
4.  `docs.abdia.es` toma la referencia `assetRef` del Document Manager y ejecuta la extracción/OCR/limpieza y edición en Web Workers locales sin almacenar el binario primario.
5.  `templates.abdia.es` toma la plantilla versionada y los datos operacionales para orquestar la generación del PDF final.
6.  El PDF final se devuelve al **Document Manager** para archivarse como una nueva versión o nuevo asset.
7.  Cada fase técnica reporta su progreso en tiempo real de forma inmutable a **ABDLogs**.
8.  **ABDAnalytics** explota los datos y métricas agregadas mediante lecturas no transaccionales de vistas materializadas.

---

## 18. Scaffolding y Scripts de Automatización (Skeletal Scaffolding)
Para agilizar el desarrollo y evitar la duplicación de código redundante e incoherencias de maquetación, los equipos de desarrollo junior reutilizarán la estructura y configuración (cascarón) de **`ABDQuiz`** como boilerplate de referencia.

### Pasos para el Scaffolding de Nuevas Apps:
1.  **Duplicar Directorio**: Clonar el directorio raíz de `ABDQuiz` para crear los nuevos repositorios (`ABDDocsManager`, `ABDDocsParser`, `ABDTemplatesGov`).
2.  **Ajuste de Metadatos (`package.json`)**:
    *   Modificar el `"name"` de la aplicación.
    *   Asegurar que la sección `"pnpm.overrides"` mantenga los enlaces locales directos al SDK y Widgets centralizados:
        ```json
        "overrides": {
          "@ajabadia/ecosystem-widgets": "link:../ABDEcosystemWidgets",
          "@ajabadia/satellite-sdk": "link:../ABDSatelliteSDK"
        }
        ```
    *   Modificar los puertos de desarrollo en la sección `"scripts"` para evitar colisiones en la máquina local (ej. port `3300` para Quiz, `3400` para Document Manager, `3500` para Docs Parser, `3600` para Templates).
3.  **Configurar Middleware de SSO (`src/proxy.ts`)**:
    *   Editar el `appId` asignado en el manejador `withIndustrialAuth()` para coincidir con la aplicación correspondiente (`docs`, `templates`, o `documents`).
4.  **Limpieza e Inicialización de Dominios**:
    *   Eliminar la lógica específica de negocio del simulador de exámenes (ej. carpetas de features de examen o entidades de preguntas en `src/features/` o `src/models/`).
    *   Mantener intacto todo el layout raíz localized (`src/app/[locale]/layout.tsx`), los wrappers del chasis visual (`SidebarNavigation`), los esquemas de localización (`messages/`) y las suites de testing (Playwright E2E y Vitest).

### Plan de Integración en el Ecosistema
1.  **Registro en SSO/ABDAuth**: Registrar los `clientId`, `clientSecret` y `redirectUris` de `documents`, `docs` y `templates`.
2.  **Vinculación en ABDLanding**: Añadir las aplicaciones en `getSuiteApps` en `ABDLanding/src/app/[locale]/page.tsx`.
3.  **Permisos en ABDtenantGobernance**: Habilitar scopes de acción `documents:*`, `docs:*` y `templates:*` en el panel de control.
4.  **ABDAnalytics**: Conectar vistas materializadas de consumo y auditorías cruzadas.
5.  **DNS & Wildcards CNAME**: Wildcards en GoDaddy y Vercel apuntando a `cname.vercel-dns.com` habilitando `SSO Domain Guard` en middleware.
6.  **Scripts de Automatización**:
    *   **[superbuild.ps1](file:///D:/desarrollos/ABDSuite/superbuild.ps1)**: Agregar comandos de build para `ABDDocsManager`, `ABDDocsParser` y `ABDTemplatesGov`.
    *   **[start-all.bat](file:///D:/desarrollos/ABDSuite/start-all.bat)**: Agregar comandos de arranque paralelo dev en puertos `3400`, `3500` y `3600`.

---

## 19. Arquitectura y Componentes de Inteligencia Ingeridos (ABDAgRAG)

El desarrollo piloto de **ABDAgRAG** incorporó con éxito capacidades avanzadas de orquestación de inteligencia que se consolidan como estándares técnicos obligatorios para `docs.abdia.es` y `templates.abdia.es`:

### A. Motor de RAG Agéntico de Ciclo Cerrado (LangGraph & Self-Correction)
Se descarta el uso de pipelines lineales simples. La ejecución de consultas complejas sobre la base documental sigue un flujo de grafo de estados regulado por **LangGraph** (`AgenticRAGService`):
1.  **Retrieval Dinámico**: El nodo `retrieve` ejecuta búsquedas híbridas (`hybridSearch`) con nivel de intensidad variable (`FAST | DEEP | KW_ONLY`).
2.  **Validación de Relevancia (Document Grading)**: El nodo `gradeDocuments` filtra de forma paralela y determinista los fragmentos recuperados evaluando su pertinencia respecto a la consulta.
3.  **Detección de Alucinaciones (Fact Checker Node)**: Antes de dar por buena una respuesta generada, el validador `FactCheckerService.verify` realiza una auditoría profunda de claims contrastando contra las fuentes originales.
4.  **Auto-Corrección Activa (Self-Healing Loop)**: Si el score de alucinación supera el umbral crítico, el motor registra los `failed_claims`, reporta la anomalía a `AnomalyDetectionService.reportHallucination`, y redirige el flujo de vuelta al generador inyectando la restricción negativa `[ACTIVE_REPAIR]` en caliente sobre el prompt.
5.  **Streaming Reactivo**: Admite salida secuencial de tokens (`runStream`) emitiendo eventos estructurados (`connected | trace | docs | token | error`) para actualizar la consola interactiva en tiempo real sin bloquear el hilo principal.

### B. Gestión Dinámica de Prompts con Steering y Shadow Callings
Para dar flexibilidad al comportamiento del LLM sin requerir despliegues del código base:
*   **Steering Dinámico de Tareas**: La base de datos guarda perfiles de gobernanza (`ai_governance_configs`). Al procesar una acción (`PromptService.getRenderedPrompt`), el motor cruza el `tenantId` y `task` para sobredimensionar o redirigir en caliente la versión de prompt y el modelo de IA específico (ej. forzar un modelo de razonamiento profundo para auditorías EN 81-20 y uno rápido para parsing inicial).
*   **Shadow Calling (Shadow Model Routing)**: Permite registrar un prompt y modelo "sombra" (`shadowPromptKey`, `shadowModel`) que se ejecuta en segundo plano en paralelo a la petición de producción. Utilizado para auditorías silenciosas de comportamiento, detección de regresiones cognitivas y optimización A/B de prompts de producción.
*   **Sincronización por CD (`PromptSyncService`)**: Durante el ciclo de despliegue, el sistema sincroniza automáticamente los prompts maestros de contingencia definidos en el código con la colección activa en base de datos.

### C. Gobernanza de Modelos e Integridad de Límites (`AiModelManager`)
*   **Mapeo Funcional**: En lugar de acoplar un único modelo global, `AiModelManager` resuelve el target óptimo según la función (`RAG_GENERATOR`, `RAG_QUERY_REWRITER`, `REPORT_GENERATOR`, `WORKFLOW_ROUTER`, `SIDEKICK_CONTEXTUAL`).
*   **Protección de Quotas y Rate Limits**: Validación estricta previa a la inferencia (`validatePromptLimit`) calculando la carga de tokens esperada del prompt respecto al límite asignado al plan del tenant.

### D. Base de Conocimiento Relacional (Grafo de Neo4j)
*   **Extractor de Grafos (`GRAPH_EXTRACTOR`)**: Pipeline para estructurar fragmentos documentales en entidades (`Component | Procedure | Error | Model`) y relaciones (`REQUIRES | PART_OF | RESOLVES | DESCRIBES`).
*   **Driver Unificado**: Conexión singleton gestionada por `neo4j-driver` (`getNeo4jDriver`, `runCypher`) para consolidar gemelos digitales de activos industriales y realizar búsquedas semánticas conectadas.

---

## 20. Veredicto de Alineación Arquitectónica Consolidado

La capacidad documental de ABDSuite se estructura en cuatro capas complementarias:

1.  **Document Manager**: Responsable del almacenamiento, versionado, conectores por tenant y ciclo de vida del binario documental.
2.  **docs.abdia.es**: Responsable del procesamiento documental, extracción, OCR, limpieza y edición estructural de páginas.
3.  **templates.abdia.es**: Responsable de la gobernanza de plantillas, rendering de PDFs finales y publicación controlada.
4.  **ABDLogs / ABDAnalytics**: Responsable de la trazabilidad inmutable y de la explotación analítica de solo lectura.

El binario documental se conserva en el Document Manager y se referencia mediante `assetRef`. Los satélites consumen esas referencias sin asumir la propiedad del almacenamiento primario. Todo evento crítico de las tres capas queda auditado en ABDLogs con trazabilidad inmutable y hashes de integridad. La autorización efectiva permanece en la capa de IAM/Gobernanza; la UI adapta visibilidad, pero no sustituye la validación de backend.

“Toda decisión de almacenamiento, deduplicación y retención pertenece al Document Manager; toda transformación semántica o estructural pertenece a docs; toda generación y validación pertenece a templates; toda auditoría e historial inmutable pertenece a ABDLogs.”


[[ESPECIFICACIONES_ABDFILES]]

## 📚 Referencias y Grafos Relacionados

* **Especificaciones y Hitos**:
	* [[01_active_specs/ESPECIFICACIONES_ABDFILES.md]]
	* [[01_active_specs/ROADMAP.md]]

* **Diseño y Arquitectura**:
	* [[02_architecture/ANALISIS_ARQUITECTURA.md]]

* **Grafos de Interrelaciones**:
	* [[grafos/ABDFiles.md]]
