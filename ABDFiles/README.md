# ABDFiles - Gestor Documental Multi-Tenant

[![ERA 11 Certified](https://img.shields.io/badge/ERA%2011-CERTIFIED-brightgreen?style=for-the-badge&logo=shield)](../.github/workflows/audit.yml)

Sistema centralizado de almacenamiento, versionado, ciclo de vida y **conversión universal de documentos** para todo el ecosistema **ABD**. Proporciona ingesta segura, deduplicación intra-tenant, múltiples proveedores de almacenamiento, gobernanza documental (retenciones, bloqueos legales, purgas) y un motor de conversión multi-engine que soporta documentos, imágenes, OCR, audio/video, STT y TTS.

---

## Arquitectura y Tecnologías

- **Next.js 16.2.6 & React 19**: Server Components (RSC) y Server Actions.
- **Mongoose & Zod**: Modelos con tipado estricto y validación runtime.
- **Multi-Provider Storage**: Cloudinary, S3, Google Drive (SA), OneDrive (Microsoft Graph).
- **Deduplicación Intra-Tenant**: SHA-256.
- **RBAC Documental**: FILE_VIEWER, FILE_EDITOR, FILE_ADMIN, FILE_AUDITOR.
- **Conversión Universal**: Pandoc (texto), Sharp (imágenes), Tesseract (OCR), FFmpeg (audio/video), Whisper (STT), Kokoro (TTS).
- **Pipeline Multi-Motor**: Auto-cadena (video/texto, imagen+OCR/texto).
- **Modo Híbrido**: Servidor o navegador (WASM).
- **Next-Intl**: Soporte multilingüe (Inglés / Español).

---

## Guía de Inicio Rápido

### Requisitos Previos

```env
NEXT_PUBLIC_APP_ID="files"
MONGODB_URI=mongodb+srv://...
DATABASE_URL=mongodb+srv://...
CLOUDINARY_URL=cloudinary://...
```

### Comandos

```powershell
.\start.bat               # Servidor local (puerto 5005)
pnpm dev                  # Next.js dev
pnpm build                # Build producción
pnpm test                 # Tests unitarios
pnpm typecheck            # TypeScript check
```

---

## Estructura del Proyecto (`src/`)

- `src/app/[locale]/` — Enrutador Next.js localizado.
- `src/app/api/v1/convert/` — API de conversión universal:
  - `route.ts` — POST/GET genérico multi-engine
  - `pandoc/route.ts` — Conversión de documentos (formato texto)
  - `image/route.ts` — Conversión de imágenes
  - `ocr/route.ts` — OCR (Tesseract.js)
  - `media/route.ts` — Conversión audio/video (FFmpeg)
  - `stt/route.ts` — Speech-to-Text (Whisper)
  - `tts/route.ts` — Text-to-Speech (Kokoro)
  - `pipeline/route.ts` — Pipeline multi-step
- `src/app/api/v1/documents/` — CRUD de documentos, versiones, eventos, holds.
- `src/app/api/v1/connectors/` — Gestión de conectores de almacenamiento.
- `src/services/` — Lógica de negocio y motores de conversión.
- `src/models/` — Esquemas Mongoose (Document, etc.).
- `src/lib/` — Utilidades (rbac, abac, idempotencia).
- `src/actions/` — Server Actions.
- `src/components/admin/` — UI industrial.

### Servicios de Conversión

| Archivo | Engine | Propósito |
|---------|--------|-----------|
| `pandoc-service.ts` | Pandoc WASM | Documentos entre formatos (docx, html, md, pdf, etc.) |
| `pandoc-browser.ts` | Pandoc WASM (CDN) | Conversión local en navegador |
| `image-service.ts` | Sharp (Node) | Redimensionar, cambiar formato/calidad |
| `image-browser.ts` | Canvas API | Conversión local en navegador |
| `ocr-service.ts` | Tesseract.js (14 idiomas) | Extraer texto de imágenes/PDF |
| `ocr-browser.ts` | Tesseract.js (Worker) | OCR local en navegador |
| `media-service.ts` | FFmpeg WASM | Convertir audio/video entre formatos |
| `media-browser.ts` | FFmpeg WASM (CDN) | Conversión local en navegador |
| `stt-service.ts` | Whisper ONNX | Transcribir audio/video a texto/SRT/VTT |
| `stt-browser.ts` | Whisper WASM (web) | STT local en navegador |
| `tts-service.ts` | Kokoro-82M ONNX | Sintetizar texto a voz (27 voces) |
| `tts-browser.ts` | Web Speech + Kokoro | TTS local (reproducción + descarga) |
| `conversion-router.ts` | Router | Enruta peticiones al motor adecuado |
| `pipeline-router.ts` | Pipeline | Encadena motores (video → docx, OCR → html) |

---

## Documentación

- **[progress.md](./progress.md)** — Registro cronológico de avances.
- **[handoff.md](./handoff.md)** — Contexto técnico entre sesiones.
- **[docs/api.md](./docs/api.md)** — Documentación técnica de la API REST.
- **[docs/conversion.md](./docs/conversion.md)** — Guía técnica del sistema de conversión.

---

## Despliegue (Vercel)

| Variable | Local | Producción |
|:---|---:|:---|
| **NEXT_PUBLIC_APP_URL** | `http://localhost:5005` | `https://files.abdia.es` |
| **AUTH_URL** | `http://localhost:5005` | `https://files.abdia.es` |

El proveedor de almacenamiento activo se configura por Tenant desde `ABDtenantGobernance`.
