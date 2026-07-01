# Historial de Progresos — ABDFiles (Gestor Documental)

---

## [2026-06-21] — Fase 1: Core de Almacenamiento, Modelos e Ingesta

- **Modelos MongoDB**: Document, DocumentVersion, DocumentEvent, AssetSpaceLink, StorageConnector, DeletionJob, LegalHold, IdempotencyKey.
- **Servicios**: DocumentService, StorageService, ConnectorService, WebhookService, LegalHoldService, SpaceLinkService, IntegrationLogsService.
- **Storage Providers**: Cloudinary, S3/MinIO, Google Drive, OneDrive (todos funcionales).
- **API REST v1**: CRUD documentos + conectores.
- **Resultado**: 8 tests. Certificación SYSTEM CERTIFIED.

---

## [2026-06-21] — Fase 2: Borrado Lógico, Ciclos de Retención y Purga

- Ciclo de vida: `active` → `deleted_pending_retention` → `purged`.
- Retención configurable por clase (7, 30, 1, 365 días).
- Worker CRON `/api/cron/data-lifecycle` con reintentos.
- Protección: LegalHold detiene purgas.
- **Resultado**: +3 tests (11 total). Certificación.

---

## [2026-06-21] — Fase 3: RBAC, Espacios Jerárquicos y UI Industrial

- 4 roles documentales (VIEWER, EDITOR, ADMIN, AUDITOR).
- Middleware ABAC con GuardianEngine.
- Dashboard con UploadZone, DocumentDetailClient.
- **Resultado**: UI funcional con datos mock. Certificación.

---

## [2026-06-21] — Fase 4: Webhooks, Idempotencia, Concurrencia y Logs

- Webhooks firmados HMAC-SHA256 con reintento exponencial.
- Idempotencia por `Idempotency-Key`.
- Control de concurrencia (versión optimista).
- Replicación a ABDLogs (timeout 3s, no bloqueante).
- **Resultado**: +3 tests (14 total). Certificación.

---

## [2026-06-21] — Fase 4.5: Aislamiento de Deduplicación

- Tests de aislamiento intra-tenant: hash repetido en mismo tenant → dedup; hash en tenant diferente → subida independiente.
- **Resultado**: 35 tests. Certificación ERA 11.

---

## [2026-06-23] — Sesión 34: Certificación Global ERA 11

- Auditoría global monorepo (7 satélites).
- ABDFiles re-certificado sin regresiones.

---

## [2026-06-28] — Fase 5: Speech-to-Text (Whisper WASM/ONNX)

- `stt-service.ts`: Whisper vía `@xenova/transformers` (ONNX, modelo tiny.en ~75MB). FFmpeg interno decodifica cualquier entrada a 16kHz mono WAV. Soporta salida text, SRT, VTT.
- `stt-browser.ts`: Whisper vía `@remotion/whisper-web` (whisper.cpp WASM, SharedArrayBuffer). Descarga modelo en IndexedDB.
- `SttConvertClient.tsx`: UI con selector de audio, idioma (20+), modelo, formato, botones server + local, barra de progreso.
- Dependencias: `@xenova/transformers@2.17.2`, `@remotion/whisper-web@4.0.484`.
- **Pipeline Router**: FFmpeg → Whisper → Pandoc (media a documento), Tesseract → Pandoc (OCR a documento).
- **Resultado**: Conversión completa audio/video → texto con renderizado server y local.

---

## [2026-06-28] — Fase 6: Text-to-Speech (Kokoro TTS)

- `tts-service.ts`: `kokoro-js` v1.2.1 con Kokoro-82M-ONNX (q8, ~86MB). `RawAudio.toWav()` integrado.
- `tts-browser.ts`: Web Speech API para preview rápido + `kokoro-js` para descarga local de WAV.
- `TtsConvertClient.tsx`: UI con textarea, selector de voz (27 voces agrupadas por acento/género), slider de velocidad, formato (WAV/MP3/OGG), preview + descarga.
- Dependencias: `kokoro-js@1.2.1`, `@huggingface/transformers@^3.8.1`.
- **API Route**: `/api/v1/convert/tts` con GET (lista voces) y POST (síntesis).
- **Resultado**: Síntesis texto → audio completa.

---

## [2026-06-28] — APIs Dedicadas de Conversión

Se crearon 7 endpoints específicos bajo `/api/v1/convert/`:
| Ruta | Engine | Propósito |
|------|--------|-----------|
| `pandoc/` | Pandoc | Documentos entre formatos |
| `image/` | Sharp | Redimensionar/formatear imágenes |
| `ocr/` | Tesseract | Extraer texto de imágenes/PDF |
| `media/` | FFmpeg | Convertir audio/video |
| `stt/` | Whisper | Transcribir audio/video a texto |
| `tts/` | Kokoro | Sintetizar texto a audio |
| `pipeline/` | Pipeline Router | Multi-step (video → doc, OCR → doc) |

Cada endpoint expone GET (capabilities) y POST (conversión). El endpoint genérico `/api/v1/convert` continúa funcionando como dispatcher automático.

## Estado Actual

| Métrica | Valor |
|---------|-------|
| Tests | 35/35 pasando |
| Certificación | ERA 11 COMPLIANT |
| Proveedores Storage | 4 (Cloudinary, S3, Google Drive, OneDrive) |
| Modelos Datos | 8 |
| Motores Conversión | 6 (Pandoc, Sharp, Tesseract, FFmpeg, Whisper, Kokoro) |
| APIs Conversión | 8 endpoints (1 genérico + 7 específicos) |
| APIs Core | CRUD docs + conectores + cron + gdpr |
| Roles RBAC | FILE_VIEWER, FILE_EDITOR, FILE_ADMIN, FILE_AUDITOR |
| Componentes UI | 8 convertidores + dashboard + documentos |
