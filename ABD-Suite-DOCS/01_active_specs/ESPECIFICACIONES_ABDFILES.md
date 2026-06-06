# Especificaciones Técnicas: ABDFiles — Gestor Documental de ABDSuite (v1.0 - Era 6.1)

> **Nombre canónico**: ABDFiles  
> **Subdominio**: `files.abdia.es` (alias: `documents.abdia.es`)  
> **Rol en la suite**: Satélite de almacenamiento, versionado, retención y trazabilidad de activos documentales  
> **Spec de referencia**: [ESPECIFICACIONES_DOCUMENTOS.md](./ESPECIFICACIONES_DOCUMENTOS.md)  
> **Estado**: Diseño aprobado — Implementación pendiente

---

## 1. Objetivo y Alcance

ABDFiles es el satélite documental de ABDSuite. Su responsabilidad es la ingesta, versionado, entrega, auditoría, retención y borrado de documentos multi-tenant. El sistema usa **Cloudinary** como almacenamiento físico inicial y **MongoDB** como base de metadatos, historial, retención, permisos y auditoría.

La unidad de trabajo no es el archivo, sino el **asset documental**: un documento maestro con múltiples versiones, referencias a espacios y estados de retención. Esto permite compartir un binario lógico entre vistas/espacios sin duplicarlo físicamente.

### Qué NO es ABDFiles

- **No es un procesador**: el procesamiento OCR/extracción lo hace `docs.abdia.es`.
- **No es un motor de plantillas**: la gobernanza y render lo hace `templates.abdia.es`.
- **No tiene lógica de negocio de otros satélites**: solo almacena, versiona y sirve activos.

### Arquitectura de Capas

```
┌─────────────────────────────────────┐
│           API / UX Layer            │  ← Next.js API Routes + UI
├─────────────────────────────────────┤
│       Domain / Business Layer       │  ← DocumentService, VersionService, etc.
├─────────────────────────────────────┤
│        Persistence Layer            │  ← MongoDB (metadatos, versiones, eventos)
├─────────────────────────────────────┤
│       Storage Provider Layer        │  ← Cloudinary (binarios), futuro S3
├─────────────────────────────────────┤
│       Integration Layer             │  ← ABDLogs, ABDAnalytics, ABDAuth
└─────────────────────────────────────┘
```

---

## 2. Principios de Diseño

| Principio | Regla |
|-----------|-------|
| **Inmutabilidad** | Ninguna versión histórica se sobrescribe. Versionado append-only. |
| **Multi-tenancy** | Toda entidad incluye `tenantId` y se indexa por tenant. |
| **Trazabilidad** | Toda operación sensible genera un evento append-only en `document_events`. |
| **Retención legal** | Legal holds bloquean borrado, purga y migración destructiva. |
| **Storage desacoplado** | Cloudinary es una implementación física, no la fuente de verdad. `assetRef` identifica; `storageRef` localiza. |
| **Offline-First (cliente)** | La UI consume metadatos y URLs firmadas. Los binarios nunca se replican al cliente. |

### 2.1 Modelo Offline-First en ABDFiles

ABDFiles es, por naturaleza, un sistema con **backend obligatorio** (MongoDB + Cloudinary). La regla Offline-First de ABDSuite se aplica así:

- **Backend (MongoDB + Cloudinary)**: fuente de verdad para metadatos, versiones, eventos y binarios. Toda operación de escritura (upload, versionado, borrado, holds) es necesariamente server-side.
- **Cliente (Dexie.js)**: caché local de metadatos de assets y listados. La UI puede funcionar con datos cacheados para lectura, pero cualquier mutación requiere conexión al backend.
- **Binarios**: nunca se descargan al cliente salvo para visualización puntual vía URL firmada. No se almacenan en Dexie.
- **Sincronización**: los metadatos cacheados en Dexie se invalidan/actualizan cuando el cliente reconecta.

### 2.2 Patrón de API Routes en Next.js

> **Regla de ABDSuite**: ❌ Lógica de negocio en API Routes.

Las API Routes de Next.js actúan exclusivamente como **capa de transporte**. Su responsabilidad es:
1. Parsear y validar el request (Zod).
2. Extraer el contexto de autenticación (JWT → `tenantId`, `roles`).
3. **Delegar** al servicio de dominio correspondiente (`DocumentService`, `VersionService`, etc.).
4. Serializar y devolver la respuesta.

Toda la lógica de negocio vive en servicios dentro de `src/services/`, nunca en los handlers de ruta.

---

## 3. Modelo de Datos

### 3.1 Colección `documents`

Estado maestro del asset documental.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `assetId` | string | Identificador interno del asset (UUID). |
| `assetRef` | string | Contrato lógico estable: `files:{tenantId}:{assetId}:{versionNumber}`. |
| `tenantId` | string | Inquilino propietario. |
| `title` | string | Nombre funcional del documento. |
| `tags` | string[] | Etiquetas para clasificación y búsqueda. |
| `status` | enum | `active`, `deleted_pending_retention`, `purge_due`, `purged`. |
| `currentVersionId` | string | Puntero a la versión vigente. |
| `latestHash` | string | SHA-256 de la versión activa. |
| `storageProvider` | enum | `cloudinary` inicialmente. |
| `storageRefCurrent` | string | Referencia física activa en el proveedor. |
| `retentionClass` | string | Clase de retención aplicable. |
| `sensitivityLevel` | enum | `low`, `medium`, `high`, `restricted`. |
| `legalHold` | boolean | Bloqueo legal activo. |
| `version` | number | Contador monotónico para concurrencia optimista. |
| `createdAt` | date | Fecha de creación. |
| `updatedAt` | date | Última modificación. |
| `deletedAt` | date? | Fecha de borrado lógico. |
| `deletedBy` | string? | Actor del borrado. |
| `purgeAt` | date? | Fecha planificada de purga. |

### 3.2 Colección `document_versions`

Historial inmutable de versiones. **Nunca se actualiza ni borra una versión histórica.**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `versionId` | string | Identificador de versión (UUID). |
| `tenantId` | string | Inquilino. |
| `assetId` | string | Documento al que pertenece. |
| `versionNumber` | number | Secuencia creciente (1, 2, 3…). |
| `hash` | string | SHA-256 del binario. |
| `checksumAlgorithm` | string | `SHA-256`. |
| `storageRef` | string | Ruta física de esa versión en el proveedor. |
| `mimeType` | string | Tipo MIME del binario. |
| `sizeBytes` | number | Tamaño del binario en bytes. |
| `createdBy` | string | Actor que generó la versión. |
| `createdAt` | date | Fecha de creación. |
| `isCurrent` | boolean | Indica si es la versión vigente. |
| `supersedesVersionId` | string? | Versión anterior sustituida. |
| `deletedAt` | date? | Solo si fue marcada para limpieza administrativa. |

### 3.3 Colección `document_events`

Auditoría append-only. **Solo inserciones, nunca updates ni deletes.**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `eventId` | string | Identificador único del evento (UUID). |
| `tenantId` | string | Inquilino. |
| `assetId` | string | Asset afectado. |
| `versionId` | string? | Versión implicada (si aplica). |
| `type` | enum | Tipo de evento (ver §10). |
| `actorId` | string | Usuario o servicio responsable. |
| `correlationId` | string | Correlación extremo a extremo con ABDLogs. |
| `payload` | object | Detalle contextual del evento. |
| `createdAt` | date | Momento de ocurrencia. |

### 3.4 Colección `legal_holds`

Bloqueos legales explícitos sobre documentos.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `holdId` | string | Identificador del hold. |
| `tenantId` | string | Inquilino. |
| `assetId` | string | Documento bloqueado. |
| `reason` | string | Motivo legal. |
| `status` | enum | `active`, `released`. |
| `createdBy` | string | Actor que lo aplica. |
| `createdAt` | date | Inicio del hold. |
| `releasedAt` | date? | Fin del hold. |

### 3.5 Colección `asset_space_links`

Junction table entre assets y espacios lógicos. Un asset puede pertenecer a múltiples spaces sin duplicar el binario.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `linkId` | string | Identificador del vínculo. |
| `tenantId` | string | Inquilino. |
| `assetId` | string | Asset. |
| `spaceId` | string | Espacio lógico destino. |
| `spacePath` | string | Ruta denormalizada para lectura rápida. |
| `isPrimary` | boolean | Indica el espacio principal. |
| `createdAt` | date | Alta del vínculo. |
| `createdBy` | string? | Autor del vínculo. |

### 3.6 Colección `storage_connectors`

Configuración del backend físico de almacenamiento por tenant.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `connectorId` | string | Identificador del conector. |
| `tenantId` | string | Inquilino. |
| `providerType` | enum | `cloudinary` o futuro `s3Compatible`. |
| `status` | enum | `active`, `inactive`. |
| `credentialsRef` | string | Referencia segura a credenciales (nunca en claro). |
| `allowedScopes` | string[] | Operaciones permitidas. |
| `retentionPolicy` | object | Política de retención aplicada. |
| `auditMode` | string | Modo de auditoría del conector. |

### 3.7 Colección `deletion_jobs`

Jobs de purga programados para la limpieza diferida.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `jobId` | string | Identificador del job. |
| `tenantId` | string | Inquilino. |
| `assetId` | string | Documento a purgar. |
| `purgeAt` | date | Fecha en que ejecutar la purga. |
| `status` | enum | `pending`, `completed`, `failed`. |
| `attempts` | number | Intentos de ejecución. |
| `lastError` | string? | Último error registrado. |
| `createdAt` | date | Fecha de programación. |

---

## 4. Índices MongoDB

| Colección | Índice | Objetivo |
|-----------|--------|----------|
| `documents` | `{ tenantId: 1, assetId: 1 }` **unique** | Búsqueda y unicidad por tenant. |
| `documents` | `{ tenantId: 1, status: 1, updatedAt: -1 }` | Listados de activos recientes. |
| `documents` | `{ tenantId: 1, currentVersionId: 1 }` | Resolución rápida de versión activa. |
| `documents` | `{ tenantId: 1, title: 1 }` | Búsqueda por título. |
| `documents` | `{ tenantId: 1, tags: 1 }` | Búsqueda por etiquetas. |
| `document_versions` | `{ tenantId: 1, assetId: 1, versionNumber: -1 }` **unique** | Secuencia inmutable por asset. |
| `document_versions` | `{ tenantId: 1, hash: 1 }` | Detección de duplicados por tenant (deduplicación). |
| `document_events` | `{ tenantId: 1, assetId: 1, createdAt: -1 }` | Auditoría cronológica. |
| `document_events` | `{ tenantId: 1, correlationId: 1 }` | Trazado extremo a extremo con ABDLogs. |
| `legal_holds` | `{ tenantId: 1, assetId: 1, status: 1 }` | Bloqueo legal por documento. |
| `asset_space_links` | `{ tenantId: 1, spaceId: 1, assetId: 1 }` | Navegación por espacios. |
| `deletion_jobs` | `{ tenantId: 1, purgeAt: 1, status: 1 }` | Limpieza automática y retención. |

> **Regla**: toda consulta de usuario DEBE incluir `tenantId` como primer filtro. Nunca se mezclan resultados entre tenants.

---

## 5. `assetRef` — Contrato Lógico Central

`assetRef` es el identificador lógico estable del documento. No depende del path físico de Cloudinary ni de ningún proveedor.

**Formato**: `files:{tenantId}:{assetId}:{versionNumber}`

**Ejemplo**: `files:tenant-acme:doc-a1b2c3:7`

### Reglas

| Concepto | Función |
|----------|---------|
| `assetRef` | Identifica lógicamente el asset. Consumido por `docs` y `templates`. |
| `storageRef` | Localiza físicamente el binario en Cloudinary/S3. Nunca expuesto a otros satélites. |
| `versionId` | Preserva la historia. Clave interna de la versión. |
| `hash` | Valida integridad (SHA-256). |

**Regla de oro**: `docs.abdia.es` y `templates.abdia.es` NUNCA dependen de `storageRef`. Solo el Document Manager resuelve la ubicación física.

---

## 6. API REST

### Fase 1 — Core

| Endpoint | Método | Función |
|----------|--------|---------|
| `/v1/documents` | `POST` | Crear documento con binario inicial. |
| `/v1/documents` | `GET` | Listar documentos del tenant (paginado). |
| `/v1/documents/{assetId}` | `GET` | Obtener documento maestro + versión actual. |
| `/v1/documents/{assetId}/versions` | `POST` | Crear nueva versión inmutable. |
| `/v1/documents/{assetId}/versions` | `GET` | Listar historial de versiones. |
| `/v1/documents/{assetId}/versions/{versionId}` | `GET` | Obtener versión concreta. |

### Fase 2 — Borrado, Retención y Auditoría

| Endpoint | Método | Función |
|----------|--------|---------|
| `/v1/documents/{assetId}` | `DELETE` | Borrado lógico → `deleted_pending_retention`. |
| `/v1/documents/{assetId}/events` | `GET` | Auditoría y trazabilidad del asset. |

### Fase 3 — Metadatos, Spaces y Legal Holds

> **Nota**: Legal holds se mueve a Fase 3 porque para el MVP no es crítico. El borrado lógico con retención temporal (Fase 2) ya protege contra borrado accidental.

| Endpoint | Método | Función |
|----------|--------|---------|
| `/v1/documents/{assetId}/holds` | `POST` | Aplicar legal hold. |
| `/v1/documents/{assetId}/holds/{holdId}` | `DELETE` | Liberar legal hold. |

| `/v1/documents/{assetId}/metadata` | `PATCH` | Parchar metadatos (título, tags, sensibilidad). |
| `/v1/documents/{assetId}/spaces` | `POST` | Vincular a un space. |
| `/v1/documents/{assetId}/spaces/{linkId}` | `DELETE` | Desvincular de un space. |

### Reglas Generales de API

1. **Paginación obligatoria** en todo listado.
2. **Filtros por `tenantId`** siempre implícitos desde el JWT/session.
3. **`Idempotency-Key`** en `POST` sensibles (upload, versión, hold).
4. **Rate limiting** por tenant y por token.
5. **Versionado de API** con prefijo `/v1`.

---

## 7. Operaciones Core — Pseudocódigo

### 7.1 Upload de Documento

```typescript
async function uploadDocument(input: UploadInput) {
  const commandId = input.idempotencyKey ?? crypto.randomUUID();
  if (await processedCommandExists(commandId)) {
    return await getProcessedResult(commandId);
  }

  await beginTransaction();

  assertTenantAccess(input.tenantId, input.actorId);
  assertUploadQuota(input.tenantId, input.file.size);

  const hash = await sha256(input.file);

  // ── Deduplicación ──────────────────────────────────────────────
  // Comprobar si ya existe una versión con este hash en el tenant.
  // Si existe, se reutiliza el storageRef en lugar de subir de nuevo.
  const existingVersion = await findVersionByHash(input.tenantId, hash);
  const uploaded = existingVersion
    ? { storageRef: existingVersion.storageRef } // Reutilizar binario
    : await uploadToCloudinarySigned(input.file, input.tenantId);
  // ──────────────────────────────────────────────────────────────

  const asset = await createDocumentAsset({
    tenantId: input.tenantId,
    title: input.title,
    retentionClass: input.retentionClass,
    sensitivityLevel: input.sensitivityLevel,
    latestHash: hash,
    storageProvider: 'cloudinary',
    storageRefCurrent: uploaded.storageRef,
    status: 'active',
    deduplicated: !!existingVersion, // Flag de deduplicación para tracking
  });

  const version = await createDocumentVersion({
    assetId: asset.assetId,
    tenantId: input.tenantId,
    versionNumber: 1,
    hash,
    checksumAlgorithm: 'SHA-256',
    storageRef: uploaded.storageRef,
    mimeType: input.mimeType,
    sizeBytes: input.file.size,
    createdBy: input.actorId,
    isCurrent: true,
  });

  await updateCurrentAssetPointer(asset.assetId, version.versionId, hash);
  await writeEvent('DOCUMENT_CREATED', asset.assetId, version.versionId, {
    ...input,
    deduplicated: !!existingVersion,
  });
  await linkSpaces(asset.assetId, input.spaceIds, input.actorId);
  await trackUsage(input.tenantId, input.file.size, 'upload');

  await storeProcessedCommand(commandId, {
    assetRef: asset.assetRef,
    assetId: asset.assetId,
    versionId: version.versionId,
  });

  await commitTransaction();
  return { assetRef: asset.assetRef, assetId: asset.assetId, versionId: version.versionId };
}
```

> **Nota sobre deduplicación**: La comprobación `findVersionByHash(tenantId, hash)` busca por el índice `{ tenantId: 1, hash: 1 }` en `document_versions`. La deduplicación **solo opera dentro del mismo tenant** para evitar inferencias cross-tenant (ver ESPECIFICACIONES_DOCUMENTOS.md §5).

### 7.2 Crear Nueva Versión

```typescript
async function createNewVersion(input: NewVersionInput) {
  await beginTransaction();

  const asset = await getDocumentAsset(input.assetId);
  assertTenantAccess(input.tenantId, input.actorId);
  assertNotPurged(asset);
  assertNoActiveLegalHold(asset);

  const hash = await sha256(input.file);
  const uploaded = await uploadToCloudinarySigned(input.file, input.tenantId);
  const versionNumber = asset.latestVersionNumber + 1;

  const version = await createDocumentVersion({
    assetId: asset.assetId,
    tenantId: input.tenantId,
    versionNumber,
    hash,
    checksumAlgorithm: 'SHA-256',
    storageRef: uploaded.storageRef,
    mimeType: input.mimeType,
    sizeBytes: input.file.size,
    createdBy: input.actorId,
    isCurrent: true,
    supersedesVersionId: asset.currentVersionId,
  });

  await demotePreviousVersions(asset.assetId, version.versionId);
  await updateCurrentAssetPointer(asset.assetId, version.versionId, hash);
  await writeEvent('DOCUMENT_VERSION_CREATED', asset.assetId, version.versionId, input);

  await commitTransaction();
  return version;
}
```

### 7.3 Borrado Lógico

```typescript
async function logicalDeleteDocument(input: DeleteInput) {
  await beginTransaction();

  const asset = await getDocumentAsset(input.assetId);
  assertTenantAccess(input.tenantId, input.actorId);
  assertNoActiveLegalHold(asset);

  const purgeAt = computePurgeAt(asset.retentionClass, input.now);

  await markDocumentDeleted({
    assetId: asset.assetId,
    tenantId: input.tenantId,
    status: 'deleted_pending_retention',
    deletedAt: input.now,
    deletedBy: input.actorId,
    purgeAt,
  });

  await revokeAllSignedUrls(asset.assetId);
  await writeEvent('DOCUMENT_LOGICAL_DELETED', asset.assetId, undefined, { ...input, purgeAt });
  await scheduleDeletionJob({ tenantId: input.tenantId, assetId: asset.assetId, purgeAt });

  await commitTransaction();
}
```

---

## 8. Borrado, Retención y Legal Holds

### 8.1 Ciclo de Vida del Borrado

```
active → deleted_pending_retention → purge_due → purged
```

| Estado | Significado | Acción |
|--------|-------------|--------|
| `active` | Documento operativo | Sin cambios. |
| `deleted_pending_retention` | Borrado lógico realizado | Espera a que la retención expire. URLs revocadas. |
| `purge_due` | Retención vencida, sin legal hold | Elegible para eliminación física. |
| `purged` | Binario eliminado de Cloudinary | Metadato cerrado. |

### 8.2 Reglas de Purging

1. Si `legalHold = true`, el documento **no puede purgarse**, sin excepciones.
2. Si existe retención activa, el binario se conserva hasta `purgeAt`.
3. Si el job de purga falla, el documento permanece en `deleted_pending_retention` y se reintenta con backoff.
4. Toda purga exitosa genera un evento `DOCUMENT_PURGED` y un webhook firmado.

### 8.3 Worker de Purga (CRON)

```typescript
async function purgeExpiredDocuments(now: Date) {
  const candidates = await findDocuments({
    status: 'deleted_pending_retention',
    purgeAt: { $lte: now },
    legalHold: false,
  });

  for (const doc of candidates) {
    try {
      await beginTransaction();
      await deleteCloudinaryAsset(doc.storageRefCurrent);
      await markDocumentPurged(doc.assetId, now);
      await writeEvent('DOCUMENT_PURGED', doc.assetId, undefined, { now });
      await commitTransaction();
      await emitWebhook('document.deleted.purged', doc);
    } catch (err) {
      await rollbackTransaction();
      await scheduleRetry(doc.assetId);
    }
  }
}
```

### 8.4 Legal Holds

- Un legal hold **bloquea** cualquier borrado, purga o migración destructiva.
- Solo un `FILE_ADMIN` puede aplicar o liberar un hold.
- Toda operación de hold genera evento auditable.
- Un documento puede tener múltiples holds activos (todos deben liberarse para permitir purga).

---

## 9. RBAC y Autorización

### 9.1 Roles Operativos

| Rol | Permisos |
|-----|----------|
| `FILE_VIEWER` | Ver metadatos, listar versiones autorizadas, descargar. |
| `FILE_EDITOR` | Subir nuevas versiones, editar metadatos no bloqueados. |
| `FILE_ADMIN` | Gestionar retención, legal hold, conectores y borrado lógico. |
| `FILE_AUDITOR` | Leer eventos y trazabilidad, sin mutación de datos. |

### 9.2 Reglas de Autorización

1. Toda decisión de acceso se valida en **backend** con ABDAuth y claims firmados.
2. La UI solo refleja permisos; **nunca los sustituye**.
3. El middleware valida `tenantId`, `roles`, `scopes` y correspondencia entre subdominio y tenant del JWT.
4. Ninguna operación destructiva se permite sin rol explícito.
5. `FILE_AUDITOR` **no puede mutar** datos.
6. `FILE_EDITOR` **no puede aplicar** `legal_hold`.

### 9.3 Regla de Decisión

```typescript
function authorize(user: User, action: Action, resource: Resource): boolean {
  if (user.tenantId !== resource.tenantId) return false;
  if (resource.legalHold && action === 'delete') return false;
  if (!hasRolePermission(user.roles, action)) return false;
  return true;
}
```

### 9.4 Permisos por Acción

| Acción | Requisito |
|--------|-----------|
| Ver documento | `FILE_VIEWER` o superior + mismo `tenantId`. |
| Subir versión | `FILE_EDITOR` o superior + permiso de escritura. |
| Aplicar hold | `FILE_ADMIN` + validación reforzada. |
| Borrar lógico | `FILE_ADMIN` + sin legal hold activo. |
| Auditar | `FILE_AUDITOR` o superior. |

---

## 10. Eventos y Webhooks

### 10.1 Catálogo de Eventos

Estos eventos se registran **siempre** en `document_events` (auditoría interna) y se replican a ABDLogs. Los webhooks externos son opcionales y se activan cuando haya consumidores reales.

| Evento | Cuándo se emite | Fase |
|--------|-----------------|------|
| `DOCUMENT_CREATED` | Alta del asset maestro. | 1 |
| `DOCUMENT_VERSION_CREATED` | Nueva versión inmutable creada. | 1 |
| `DOCUMENT_METADATA_UPDATED` | Parche de metadatos aplicado (PATCH). | 3 |
| `DOCUMENT_LOGICAL_DELETED` | Documento marcado para retención/purga. | 2 |
| `DOCUMENT_PURGED` | Binario físicamente eliminado de Cloudinary. | 2 |
| `LEGAL_HOLD_APPLIED` | Se activa un hold legal. | 3 |
| `LEGAL_HOLD_RELEASED` | Se libera el hold legal. | 3 |
| `UPLOAD_FAILED` | Fallo de subida o validación. | 1 |

### 10.2 Dos Niveles de Emisión

| Nivel | Descripción | Fase |
|-------|-------------|------|
| **Eventos internos** | Escritura en `document_events` + replicación a ABDLogs. Obligatorio desde Fase 1. | 1 |
| **Webhooks externos** | Emisión HTTP firmada a consumidores externos (`docs`, `templates`, terceros). Opcional hasta que existan consumidores reales. | 4 |

> **Nota pragmática**: Mientras `docs.abdia.es` y `templates.abdia.es` no estén implementados, no tiene sentido emitir webhooks al vacío. Los eventos internos ya garantizan trazabilidad completa. Los webhooks se activan en Fase 4 cuando haya un receptor real.

### 10.3 Payload Base de Webhook (Fase 4)

```json
{
  "eventId": "uuid",
  "tenantId": "tenant-acme",
  "assetId": "asset-a1b2c3",
  "assetRef": "files:tenant-acme:asset-a1b2c3:7",
  "type": "DOCUMENT_VERSION_CREATED",
  "correlationId": "corr-789",
  "createdAt": "2026-06-04T17:21:00Z",
  "data": {
    "versionNumber": 7,
    "hash": "sha256:abc123..."
  }
}
```

### 10.4 Reglas de Entrega (Fase 4)

1. Firmar cada payload con HMAC.
2. Reintentar con backoff exponencial y jitter.
3. Considerar 2xx como entrega aceptada.
4. Guardar `eventId` procesado para evitar dobles efectos (idempotencia).
5. Los fallos permanentes van a cola de incidencias.

---

## 11. Spaces y Particionamiento Jerárquico

Los Spaces son **ámbitos lógicos** (departamento, proyecto, carpeta) que agrupan assets sin duplicar binarios.

### Reglas

1. Un asset puede pertenecer a **múltiples** Spaces simultáneamente a través de `asset_space_links`.
2. El Space solo es un **vínculo lógico**, nunca una copia del binario.
3. Borrar un asset de un Space solo elimina el link; el binario persiste si tiene otros vínculos.
4. Si se eliminan todos los links, el documento sigue existiendo como asset huérfano (la purga va por retención, no por links).
5. `spacePath` es un path materializado para navegación rápida (ej. `/rrhh/contratos/2026`).

---

## 12. Conectores de Storage

### 12.1 Conector por Defecto: Cloudinary

- Proveedor base para todos los tenants.
- Segregación por prefijo: `tenants/{tenantId}/abdfiles/{assetId}`.
- URLs firmadas con expiración corta para descargas.
- Acceso público **bloqueado** en producción.
- Estado actual: **en pruebas**.

### 12.2 Reglas de Cuota

1. **Verificación previa**: antes de subir, validar `TenantQuotaService.hasStorageQuota(tenantId, size)`.
2. **Tracking**: cada alta/baja reporta uso a `UsageService.trackStorage(tenantId, size, type)`.
3. **Alertas**: ABDAnalytics consume el tracking para alertas de consumo.

### 12.3 Conector Futuro: S3-Compatible

Preparado en el modelo de datos (`storageProvider`, `storageRef` por versión) pero no implementado en Fases 0-4.

---

## 13. Integración con el Ecosistema ABDSuite

### 13.1 ABDLogs

- Todos los eventos de `document_events` se replican a ABDLogs vía `correlationId`.
- ABDLogs es el sistema central de auditoría de la suite.
- Los eventos de ABDFiles usan el vocabulario unificado de auditoría forense.

### 13.2 ABDAnalytics

- Tracking de uso de storage por tenant (`UsageService`).
- Métricas de documentos activos, versionados, purgados.
- Alertas de consumo y tendencias.

### 13.3 ABDAuth

- Validación de JWT y claims en middleware.
- Roles del tenant (`FILE_VIEWER`, `FILE_EDITOR`, etc.) provienen de ABDAuth.
- SSO Domain Guard para aislamiento cross-cluster.

### 13.4 Satélites Consumidores

- **docs.abdia.es**: consume `assetRef` para procesamiento OCR/extracción. Nunca accede al binario directamente.
- **templates.abdia.es**: consume `assetRef` para renderizado. Puede generar nuevos assets que delega al Document Manager.

---

## 14. UI — Pantallas Básicas (Fase 3)

La interfaz de ABDFiles sigue la estética **Aseptic Retro-Minimalist** de la suite, usando `tokens.css` y componentes reutilizables.

### 14.1 Pantallas Mínimas

| Pantalla | Función | Componentes clave |
|----------|---------|-------------------|
| **Dashboard / Listado** | Vista principal con tabla de documentos del tenant, filtros por status/tags/space, paginación | `DocumentTable`, `FilterBar`, `Pagination` |
| **Upload** | Modal o vista de subida con drag-and-drop, validación de tipo/tamaño, barra de progreso | `UploadZone`, `ProgressBar`, `QuotaIndicator` |
| **Detalle de Asset** | Metadatos del documento, historial de versiones, spaces vinculados, estado de retención | `AssetHeader`, `VersionTimeline`, `SpaceChips`, `RetentionBadge` |
| **Visor de Versión** | Preview del binario (si es PDF/imagen) + metadatos de la versión concreta + botón de descarga | `FilePreview`, `VersionMeta`, `DownloadButton` |
| **Auditoría** | Timeline de eventos del asset, filtrable por tipo y fecha | `EventTimeline`, `EventFilter` |

### 14.2 Reglas de UI

1. **Toda acción de mutación** (upload, borrar, aplicar hold) debe mostrar feedback visual (Toast o Terminal Log).
2. **Los permisos del usuario** condicionan qué botones/acciones se muestran (pero el backend siempre valida).
3. **La descarga** nunca expone `storageRef`; se genera una URL firmada temporal desde el backend.
4. **La paginación** usa cursor-based, no offset.
5. **Los estados de carga** deben usar skeletons, nunca pantallas en blanco.

---

## 15. Roadmap de Evolución

### Fases 0-4: Implementación Core (scope de este documento)

| Fase | Entregable | Duración estimada |
|------|------------|-------------------|
| **0** | Scaffolding: proyecto Next.js, registro en superbuild/start-all, health check | 1-2 días |
| **1** | Modelo de datos, CRUD, upload Cloudinary, `assetRef`, API core, eventos internos | 1-2 semanas |
| **2** | Borrado lógico, retención, eventos de auditoría, CRON de purga | 1 semana |
| **3** | RBAC, Spaces, PATCH metadatos, Legal Holds, UI básica (Aseptic Retro-Minimalist) | 1-2 semanas |
| **4** | Webhooks firmados, idempotencia, concurrencia optimista, ABDAnalytics | 1-2 semanas |

### Fase 5: Escalabilidad (futuro)

- Migración Cloudinary → S3-compatible (si el negocio lo requiere)
- Event bus (si la suite adopta Kafka)
- Observabilidad avanzada
- Búsqueda multi-tenant avanzada
- ABAC completo

### Fase 6: Operaciones Avanzadas (futuro lejano)

- Despliegues blue-green (Vercel/PM2)
- Cifrado a nivel de campo MongoDB
- Schema versionado de eventos
- Dashboards dedicados de observabilidad

---

## 16. Scaffolding y Scripts de Automatización

### 16.1 Ubicación del Proyecto

```
D:\desarrollos\ABDSuite\ABDFiles\
```

### 16.2 Registro en superbuild.ps1

ABDFiles debe añadirse como entrada en `D:\desarrollos\ABDSuite\superbuild.ps1` para que se construya junto con el resto de satélites.

### 16.3 Registro en start-all.bat

ABDFiles debe añadirse como entrada en `D:\desarrollos\ABDSuite\start-all.bat` para que se inicie en desarrollo local.

### 16.4 Referencia de Scaffolding

Para la estructura de carpetas y configuración Next.js, tomar como referencia:
- **ABDQuiz**: satélite más completo y maduro.
- **ABDAnalytics**: satélite ligero, buena referencia para un proyecto nuevo.
- **ABDLogs**: referencia adicional.

---

## 17. Fallos en Subida

Si falla la subida a Cloudinary, ABDFiles debe conservar el contexto y permitir reintento idempotente.

| Estado | Significado |
|--------|-------------|
| `upload_pending` | Petición iniciada. |
| `upload_failed` | Fallo antes de confirmar binario. |
| `upload_retriable` | Puede reintentarse con el mismo `idempotencyKey`. |
| `active` | Subida válida y confirmada. |

**Regla**: nunca crear una versión vigente si el upload no se completó correctamente.

---

*Documento generado: 4 de junio de 2026*  
*Versión: 1.0*  
*Era: 6.1 — Industrial Aseptic Standards*

## 📚 Referencias y Grafos Relacionados

* **Especificaciones y Hitos**:
	* [[01_active_specs/ESPECIFICACIONES_DOCUMENTOS.md]]
	* [[01_active_specs/ROADMAP.md]]

* **Diseño y Arquitectura**:
	* [[02_architecture/ANALISIS_ARQUITECTURA.md]]

* **Grafos de Interrelaciones**:
	* [[grafos/ABDFiles.md]]
