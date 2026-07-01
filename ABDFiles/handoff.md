# Handoff: ABDFiles (Gestor Documental) — Fases 1-6 Completas

## Objetivo del Proyecto

Gestor documental multi-tenant con versionado inmutable, deduplicación intra-tenant, múltiples proveedores de almacenamiento, ciclo de vida con retención y purga, webhooks firmados, control de concurrencia y **motor de conversión universal** (documentos, imágenes, OCR, audio/video, STT, TTS).

## Estado Actual

- **Puerto de Desarrollo**: `5005`
- **Tests**: 35/35 pasando con Vitest
- **Certificación**: `SYSTEM CERTIFIED - ERA 11 COMPLIANT`
- **Motores de Conversión**: Pandoc, Sharp, Tesseract, FFmpeg, Whisper, Kokoro — todos funcionales
- **Pipeline Multi-Motor**: FFmpeg → Whisper → Pandoc (video a doc), Tesseract → Pandoc (OCR a doc)
- **API Dedicadas**: 8 endpoints de conversión (genérico + 7 específicos)

## Archivos en Vuelo (Pendientes / Futuros)

- Migración de webhooks síncronos a Event Bus (Kafka/RabbitMQ).
- Monitorización de salud de sockets y observabilidad SOC2.
- Indexador Elasticsearch/OpenSearch para búsqueda en metadatos.
- Integración ABAC completa con `GuardianEngine`.
- Despliegue Blue-Green y configuraciones avanzadas de Vercel.
- Cifrado criptográfico a nivel de campo en MongoDB.
- Event Sourcing para historial de transacciones de storage.

## Archivos Modificados/Creados

### Modelos (Mongoose)
- `src/models/Document.ts`, `DocumentVersion.ts`, `DocumentEvent.ts`, `AssetSpaceLink.ts`, `StorageConnector.ts`, `DeletionJob.ts`, `LegalHold.ts`, `IdempotencyKey.ts`

### Servicios Core (Documentos)
- `src/services/document-service.ts`: CRUD, deduplicación SHA-256, versionado, borrado lógico, purga.
- `src/services/storage-service.ts`: Abstracción multi-provider.
- `src/services/storage/storage-providers.ts`: Cloudinary, S3, Google Drive, OneDrive.
- `src/services/connector-service.ts`, `webhook-service.ts`, `legal-hold-service.ts`, `space-link-service.ts`, `integration-logs-service.ts`.

### Servicios de Conversión
- `src/services/conversion-router.ts`: Enruta peticiones al motor según MIME.
- `src/services/pipeline-router.ts`: Encadena motores en pipelines multi-step.
- `src/services/pandoc-service.ts` + `pandoc-core.ts` + `pandoc-browser.ts`: Documentos (WASM).
- `src/services/image-service.ts` + `image-browser.ts`: Imágenes (Sharp + Canvas).
- `src/services/ocr-service.ts` + `ocr-browser.ts`: OCR (Tesseract.js, 14 idiomas).
- `src/services/media-service.ts` + `media-browser.ts`: Audio/Video (FFmpeg WASM).
- `src/services/stt-service.ts` + `stt-browser.ts`: Speech-to-Text (Whisper ONNX/WASM).
- `src/services/tts-service.ts` + `tts-browser.ts`: Text-to-Speech (Kokoro-82M, 27 voces).

### API Routes de Conversión
- `src/app/api/v1/convert/route.ts`: POST/GET genérico multi-engine.
- `src/app/api/v1/convert/pandoc/route.ts`: Conversión documentos.
- `src/app/api/v1/convert/image/route.ts`: Conversión imágenes.
- `src/app/api/v1/convert/ocr/route.ts`: OCR.
- `src/app/api/v1/convert/media/route.ts`: Audio/Video.
- `src/app/api/v1/convert/stt/route.ts`: STT.
- `src/app/api/v1/convert/tts/route.ts`: TTS.
- `src/app/api/v1/convert/pipeline/route.ts`: Pipeline multi-step.

### API Routes Core
- `src/app/api/v1/documents/` (CRUD + versiones + eventos + holds + metadata).
- `src/app/api/v1/connectors/` (CRUD + test de conexión).
- `src/app/api/cron/data-lifecycle/route.ts`: Worker CRON purga.
- `src/app/api/internal/gdpr/` (purge + export).

### Librerías
- `src/lib/rbac.ts`, `abac.ts`, `idempotency.ts`, `mock-dashboard-data.ts`.

### Componentes UI
- `src/components/admin/DashboardClient.tsx`, `UploadZone.tsx`, `DocumentDetailClient.tsx`.
- `src/components/admin/PandocConvertClient.tsx`, `ImageConvertClient.tsx`.
- `src/components/admin/OcrConvertClient.tsx`, `MediaConvertClient.tsx`.
- `src/components/admin/SttConvertClient.tsx`, `TtsConvertClient.tsx`.
- `src/components/admin/tabs/` (Suite, LMS, Seguridad, Gobernanza).

## Lecciones Aprendidas

1. **Deduplicación intra-tenant**: El filtro de hash debe incluir SIEMPRE `tenantId`.
2. **Conectores dinámicos**: Al activar un conector se desactivan los demás.
3. **Control de concurrencia**: Versión optimista con `VersionConflictError`.
4. **Webhooks**: Backoff exponencial 2s/4s/8s; 3 intentos máximo.
5. **Purga CRON**: Protegida por token; 5 reintentos por trabajo.
6. **Integración ABDLogs**: Timeout 3s, no bloqueante.
7. **Conversión WASM**: Todos los binarios grandes se descargan de CDN (jsDelivr/unpkg), nunca en el bundle.
8. **STT Whisper**: Modelo tiny.en ~75MB descargado de HF Hub en runtime. Cache en `/tmp/.huggingface`.
9. **FFmpeg interno**: Usado por STT para decodificar cualquier audio/video a 16kHz mono WAV.
10. **Pipeline Router**: Si un solo motor no cubre la conversión, se encadena automáticamente.
11. **Kokoro TTS**: Modelo ONNX q8 ~86MB, 27 voces organizadas por acento/género.
