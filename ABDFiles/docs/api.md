# API REST — ABDFiles (Conversión Universal)

## Autenticación

Todas las rutas `/api/v1/convert/*` requieren autenticación mediante `ensureIndustrialAccess()` del satélite `@ajabadia/satellite-sdk`. Usar token Bearer o cookie de sesión.

---

## Endpoints de Conversión

### 1. POST /api/v1/convert — Genérico Multi-Engine

Dispatcher automático. Detecta el motor según MIME de entrada y formato destino.

```json
{
  "content": "<base64 del archivo o texto plano>",
  "mimeType": "text/plain",
  "to": "html",
  "from": "markdown",
  "standalone": true,
  "toc": true,
  "width": 800,
  "height": 600,
  "quality": 80,
  "fit": "inside",
  "ocr": false,
  "language": "eng",
  "audioBitrate": "128k",
  "videoBitrate": "1M",
  "voice": "af_heart",
  "speed": 1.0
}
```

**Respuesta:**
```json
{
  "output": "<contenido convertido (base64 o texto)>",
  "mimeType": "text/html",
  "engine": "pandoc",
  "warnings": [],
  "width": 800,
  "height": 600,
  "confidence": 0.95
}
```

**Reglas de enrutamiento:**
| Condición | Engine |
|-----------|--------|
| `ocr: true` + imagen/PDF | Tesseract |
| Texto / docx / pdf / epub | Pandoc |
| Imagen | Sharp |
| Audio/Video → text/srt/vtt | Whisper (STT) |
| Texto → audio/wav/mp3/ogg | Kokoro (TTS) |
| Audio/Video | FFmpeg |
| Multi-step | Pipeline Router |

---

### 2. POST /api/v1/convert/pandoc — Documentos

Convierte documentos entre formatos de texto.

```json
{
  "content": "<contenido en base64 o texto>",
  "mimeType": "text/markdown",
  "from": "markdown",
  "to": "docx",
  "standalone": true,
  "toc": false
}
```

**Formats de entrada/salida:** html, html5, markdown, md, plain, docx, epub, latex, pdf, pptx, odt, rst, asciidoc, mediawiki, org, gfm, commonmark, csv, json, yaml.

**GET /api/v1/convert/pandoc** — Devuelve version de Pandoc y listas de formatos disponibles.

---

### 3. POST /api/v1/convert/image — Imágenes

Redimensiona y convierte imágenes entre formatos.

```json
{
  "content": "<base64>",
  "mimeType": "image/png",
  "to": "image/jpeg",
  "width": 800,
  "height": 600,
  "quality": 80,
  "fit": "inside"
}
```

**Formatos:** image/jpeg, image/png, image/webp, image/avif, image/tiff, image/gif, image/heif.

**fit:** cover, contain, fill, inside, outside.

**GET /api/v1/convert/image** — Lista formatos disponibles.

---

### 4. POST /api/v1/convert/ocr — OCR

Extrae texto de imágenes y PDFs.

```json
{
  "content": "<base64>",
  "mimeType": "image/png",
  "language": "eng"
}
```

**Idiomas:** eng, spa, fra, deu, ita, por, nld, ara, rus, jpn, kor, zho, heb, hin.

**Respuesta:**
```json
{
  "output": "texto extraído...",
  "mimeType": "text/plain",
  "confidence": 0.95,
  "blocks": [{ "bbox": { "x0": 10, "y0": 20, "x1": 100, "y2": 50 }, "text": "palabra" }],
  "engine": "tesseract"
}
```

**GET /api/v1/convert/ocr** — Lista idiomas y parámetros.

---

### 5. POST /api/v1/convert/media — Audio/Video

Convierte audio y video entre formatos. Puede extraer audio de video.

```json
{
  "content": "<base64>",
  "mimeType": "video/mp4",
  "to": "audio/mp3",
  "audioBitrate": "128k",
  "videoBitrate": "1M"
}
```

**Formatos entrada:** audio/mp3, wav, ogg, flac, aac, m4a, webm. video/mp4, webm, ogg, avi, mkv, mov.

**Formatos salida audio:** audio/mp3, wav, ogg, flac, aac.

**Formatos salida video:** video/mp4, video/webm.

**GET /api/v1/convert/media** — Lista formatos y opciones.

---

### 6. POST /api/v1/convert/stt — Speech-to-Text

Transcribe audio/video a texto, SRT o VTT.

```json
{
  "content": "<base64>",
  "mimeType": "audio/mp3",
  "to": "text",
  "language": "en",
  "model": "Xenova/whisper-tiny.en",
  "timestamps": true
}
```

**Modelos:** Xenova/whisper-tiny.en (75MB, default), tiny, base.en, base.

**Salidas:** text (plain), srt, vtt.

**GET /api/v1/convert/stt** — Lista modelos, idiomas, formatos.

---

### 7. POST /api/v1/convert/tts — Text-to-Speech

Sintetiza texto a audio con 27 voces.

```json
{
  "content": "Texto a sintetizar...",
  "voice": "af_heart",
  "speed": 1.0
}
```

**Voces:** af_heart, af_alloy, af_aoede, af_bella, af_jessica, af_kore, af_nicole, af_nova, af_river, af_sarah, af_sky (American Female). am_adam, am_echo, am_eric, am_fenrir, am_liam, am_michael, am_onyx, am_puck, am_santa (American Male). bf_emma, bf_isabella, bf_alice, bf_lily (British Female). bm_george, bm_lewis, bm_daniel, bm_fable (British Male).

**Salida:** audio/wav (base64), duración en segundos.

**GET /api/v1/convert/tts** — Lista voces completas.

---

### 8. POST /api/v1/convert/pipeline — Pipeline Multi-Step

Ejecuta una secuencia de conversiones multi-motor. Detecta automáticamente o acepta steps explícitos.

```json
{
  "content": "<base64>",
  "mimeType": "video/mp4",
  "to": "docx",
  "language": "en",
  "standalone": true
}
```

**Pipelines automáticos:**
| Entrada | Salida | Pipeline |
|---------|--------|----------|
| audio/*, video/* | docx, pdf, html, ... | FFmpeg → Whisper → Pandoc |
| image/* (ocr:true) | docx, pdf, html, ... | Tesseract → Pandoc |

**Steps explícitos (opcional):**
```json
{
  "content": "<base64>",
  "mimeType": "video/mp4",
  "steps": [
    { "engine": "ffmpeg", "to": "audio/wav" },
    { "engine": "whisper", "to": "text", "options": { "language": "en" } },
    { "engine": "pandoc", "to": "docx", "options": { "standalone": true } }
  ]
}
```

**GET /api/v1/convert/pipeline** — Lista pipelines disponibles.

---

## Códigos de Error

| Status | Significado |
|--------|-------------|
| 400 | Missing/invalid content, formato no soportado |
| 401 | No autenticado |
| 500 | Error interno del motor de conversión |

Los errores se devuelven como:
```json
{ "error": "mensaje descriptivo del error" }
```

---

## Limitaciones (Vercel Hobby)

| Límite | Valor |
|--------|-------|
| maxDuration | 120s (300s para pipeline) |
| Body size | 5-10 MB |
| Cold start Whisper | ~15-30s (modelo 75MB) |

Para archivos grandes, usar conversión local (navegador) o subir primero a storage y pasar `assetId`.
