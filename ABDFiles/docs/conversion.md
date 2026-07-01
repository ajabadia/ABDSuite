# Sistema de Conversión Universal — ABDFiles

## Arquitectura

El sistema de conversión de ABDFiles está diseñado como un **multi-engine router** que selecciona automáticamente el motor adecuado según el tipo MIME de entrada y el formato destino. Si un solo motor no cubre la conversión, el **Pipeline Router** encadena varios motores secuencialmente.

```
Cliente HTTP → /api/v1/convert
                   │
          conversion-router.ts
                   │
      ┌────────────┼────────────┐
      │            │            │
   Document      Image      Media/Audio
   (Pandoc)     (Sharp)     (FFmpeg)
      │            │            │
      │         ┌──┴──┐      ┌──┴──┐
      │         │ OCR │      │ STT │
      │      (Tesseract)   (Whisper)
      │                     │
      │                   (Kokoro TTS)
      │
  pipeline-router.ts (cuando un solo motor no basta)
      │
  FFmpeg → Whisper → Pandoc  (media → documento)
  Tesseract → Pandoc          (OCR → documento)
```

## Modo Híbrido Servidor / Navegador

Cada motor tiene dos implementaciones:

| Motor | Servidor | Navegador |
|-------|----------|-----------|
| Pandoc | Pandoc WASM (CDN jsDelivr) | Pandoc WASM |
| Sharp | Sharp native (Vercel) | Canvas API |
| Tesseract | Tesseract.js (Worker Pool) | Tesseract.js (Worker) |
| FFmpeg | FFmpeg WASM (unpkg) | FFmpeg WASM |
| Whisper | Transformers.js ONNX (HF Hub) | @remotion/whisper-web (WASM) |
| Kokoro | Kokoro-js ONNX (HF Hub) | Web Speech API + Kokoro-js |

El navegador descarga su propio WASM de CDN y procesa localmente, sin enviar datos al servidor.

## Gestión de WASM y Modelos

### Descarga en Runtime (CDN)

| Recurso | Tamaño | CDN | Cache |
|---------|--------|-----|-------|
| Pandoc | ~56 MB | jsDelivr | /tmp/pandoc.wasm |
| FFmpeg core | ~30 MB | unpkg | Cache navegador |
| Tesseract (por idioma) | 1-50 MB | CDN (Tesseract.js) | Cache navegador |
| Whisper tiny.en | ~75 MB | Hugging Face Hub | /tmp/.huggingface |
| Whisper base | ~150 MB | Hugging Face Hub | /tmp/.huggingface |
| Kokoro-82M q8 | ~86 MB | Hugging Face Hub | /tmp/.huggingface |

Ningún binario WASM está en el bundle de Vercel. Todos se descargan en runtime.

### Pipeline de Conversión STT (Audio/Video → Texto)

1. FFmpeg recibe el audio/video en cualquier formato
2. Decodifica a WAV 16kHz mono (PCM s16)
3. Se extrae el Float32Array del WAV
4. Whisper ONNX procesa el array y devuelve texto con timestamps
5. Se formatea como text, SRT o VTT

### Pipeline de Conversión TTS (Texto → Audio)

1. kokoro-js carga Kokoro-82M-ONNX (modelo StyleTextToSpeech2)
2. Se genera audio con la voz y velocidad seleccionadas
3. `RawAudio.toWav()` convierte Float32Array a WAV
4. Se devuelve como base64

## API Routes

Todas las rutas bajo `/api/v1/convert/`:

```
/api/v1/convert          ─ POST genérico (auto-detecta motor)
/api/v1/convert/pandoc   ─ Documentos entre formatos
/api/v1/convert/image    ─ Conversión de imágenes
/api/v1/convert/ocr      ─ Reconocimiento óptico
/api/v1/convert/media    ─ Audio/Video
/api/v1/convert/stt      ─ Speech-to-Text
/api/v1/convert/tts      ─ Text-to-Speech
/api/v1/convert/pipeline ─ Multi-step pipeline
```

Cada endpoint expone:
- **GET**: Capacidades (formatos, opciones, voces, etc.)
- **POST**: Conversión (base64 in, base64 out)

## Componentes UI

Cada motor tiene un componente cliente en `src/components/admin/`:

| Componente | Engine | Funcionalidad |
|------------|--------|---------------|
| `PandocConvertClient.tsx` | Pandoc | Selector formato, botón server + local |
| `ImageConvertClient.tsx` | Sharp/Canvas | Selector archivo, formato, calidad |
| `OcrConvertClient.tsx` | Tesseract | Selector archivo, idioma, previsualización |
| `MediaConvertClient.tsx` | FFmpeg | Selector audio/video, formato destino |
| `SttConvertClient.tsx` | Whisper | Selector audio, idioma, modelo, formato, progreso |
| `TtsConvertClient.tsx` | Kokoro | Textarea, voz, velocidad, preview, descarga |

## Dependencias (package.json)

```json
"pandoc-wasm": "^0.5.1",
"sharp": "^0.34.5",
"tesseract.js": "^7.0.0",
"@ffmpeg/ffmpeg": "^0.12.10",
"@ffmpeg/util": "^0.12.1",
"@xenova/transformers": "^2.17.2",
"@remotion/whisper-web": "^4.0.484",
"kokoro-js": "^1.2.1",
"@huggingface/transformers": "^3.8.1"
```

## Consideraciones de Despliegue (Vercel)

- **maxDuration**: 120s (300s pipeline). Puede no ser suficiente para archivos grandes.
- **Body size**: Límite 5-10 MB en plan Hobby.
- **Cold start**: Whisper/Kokoro descargan modelos grandes en el primer request.
- **Solución**: Para archivos grandes, ofrecer modo navegador (WASM local) o subir a storage + assetId.
