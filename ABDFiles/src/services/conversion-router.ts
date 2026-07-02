/**
 * @purpose Gestiona solicitudes de conversión de documentos y medios alineando las opciones con los tipos MIME.
 * @purpose_en Manages document and media conversion requests by routing them to appropriate services based on MIME types and options.
 * @refactorable true (contains multiple service-specific functions)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:3,imports:7,sig:sgrunv
 * @lastUpdated 2026-06-28T08:33:32.087Z
 */

import { convertDocument, type ConvertOptions, type ConvertResult } from './pandoc-service';
import { convertImage, isImageMime, isImageOutputFormat, type ImageConvertOptions, type ImageConvertResult } from './image-service';
import { performOcr, isOcrMime, type OcrOptions, type OcrResult } from './ocr-service';
import { convertMedia, isMediaMime, isMediaOutput, type MediaOptions, type MediaResult } from './media-service';
import { transcribeAudio, isSttMime, isSttOutput, formatSttOutput, type SttOptions, type SttResult } from './stt-service';
import { synthesizeSpeech, isTtsMime, isTtsOutput, type TtsOptions, type TtsResult } from './tts-service';
import { resolvePipeline, executePipeline } from './pipeline-router';

const TEXT_MIME_TYPES = [
  'text/',
  'application/json',
  'application/xml',
  'application/x-yaml',
  'application/vnd.openxmlformats-officedocument.wordprocessingml',
  'application/vnd.openxmlformats-officedocument.presentationml',
  'application/vnd.oasis.opendocument',
  'application/epub+zip',
  'application/x-latex',
  'application/pdf',
];

function isTextDocument(mimeType: string): boolean {
  const base = mimeType.split(';')[0].trim();
  return TEXT_MIME_TYPES.some((t) => base.startsWith(t));
}

export interface ConvertRequest {
  content: string;
  mimeType: string;
  from?: string;
  to: string;
  standalone?: boolean;
  toc?: boolean;
  width?: number;
  height?: number;
  quality?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  ocr?: boolean;
  language?: string;
  audioBitrate?: string;
  videoBitrate?: string;
  voice?: string;
  speed?: number;
}

export interface ConvertResponse {
  output: string;
  mimeType: string;
  warnings?: string[];
  engine?: string;
  width?: number;
  height?: number;
  confidence?: number;
}

export async function routeConversion(req: ConvertRequest): Promise<ConvertResponse> {
  const { content, mimeType, from, to, standalone, toc, width, height, quality, fit, ocr, language, voice, speed } = req;

  const baseMime = mimeType.split(';')[0].trim();

  // OCR: image/PDF → text extraction
  if (ocr && isOcrMime(baseMime)) {
    const inputBuffer = Buffer.from(content, 'base64');
    const ocrOptions: OcrOptions = { language };
    const result: OcrResult = await performOcr(inputBuffer, ocrOptions);
    return {
      output: result.text,
      mimeType: 'text/plain',
      confidence: result.confidence,
      engine: 'tesseract',
    };
  }

  // Text document conversion
  if (isTextDocument(baseMime) || to === 'html' || to === 'markdown' || to === 'plain') {
    const options: ConvertOptions = {
      from: (from || mimeTypeToSimple(baseMime)) as ConvertOptions['from'],
      to: to as ConvertOptions['to'],
      standalone,
      toc,
    };
    const result: ConvertResult = await convertDocument(content, baseMime, options);
    return {
      output: result.output,
      mimeType: outputMimeType(to),
      warnings: result.warnings,
      engine: 'pandoc',
    };
  }

  // Image conversion
  if (isImageMime(baseMime) || isImageOutputFormat(to) || to.startsWith('image/')) {
    const imageOptions: ImageConvertOptions = {
      to,
      width,
      height,
      quality,
      fit,
    };

    const inputBuffer = Buffer.from(content, 'base64');
    const result: ImageConvertResult = await convertImage(inputBuffer, baseMime, imageOptions);

    return {
      output: result.output.toString('base64'),
      mimeType: result.mimeType,
      width: result.width,
      height: result.height,
      engine: 'sharp',
    };
  }

  // Speech-to-Text: audio → text/srt/vtt
  if (isSttMime(baseMime) && isSttOutput(to)) {
    const inputBuffer = Buffer.from(content, 'base64');
    const sttOptions: SttOptions = { language };
    const result: SttResult = await transcribeAudio(inputBuffer, baseMime, sttOptions);
    const formatted = formatSttOutput(result, to);
    return {
      output: formatted.output,
      mimeType: formatted.mimeType,
      engine: 'whisper',
    };
  }

  // Text-to-Speech: text → audio
  if (isTtsMime(baseMime) && isTtsOutput(to)) {
    const ttsOptions: TtsOptions = { voice: voice as TtsOptions['voice'], speed };
    const result: TtsResult = await synthesizeSpeech(content, ttsOptions);
    return {
      output: Buffer.from(result.audio).toString('base64'),
      mimeType: result.mimeType,
      engine: 'kokoro',
    };
  }

  // Audio/Video conversion
  if (isMediaMime(baseMime) || isMediaOutput(to)) {
    const inputBuffer = Buffer.from(content, 'base64');
    const mediaOptions: MediaOptions = {
      to,
      audioBitrate: req.audioBitrate,
      videoBitrate: req.videoBitrate,
    };
    const result: MediaResult = await convertMedia(inputBuffer, baseMime, mediaOptions);
    return {
      output: result.output.toString('base64'),
      mimeType: result.mimeType,
      engine: 'ffmpeg',
    };
  }

  // Multi-step pipeline fallback (e.g., video → docx, image+ocr → html)
  const pipeline = resolvePipeline({ inputMime: baseMime, outputTo: to, ocr, language, standalone, toc });
  if (pipeline) {
    const pipelineResult = await executePipeline(content, baseMime, pipeline);
    const isText = pipelineResult.mimeType.startsWith('text/');
    return {
      output: isText
        ? Buffer.from(pipelineResult.output, 'base64').toString('utf-8')
        : pipelineResult.output,
      mimeType: pipelineResult.mimeType,
      engine: pipelineResult.engine,
    };
  }

  throw new Error(
    `Unsupported conversion: ${mimeType} → ${to}. ` +
    'Supported: text documents (Pandoc), images (sharp), OCR (Tesseract.js), audio/video (FFmpeg WASM), speech-to-text (Whisper), text-to-speech (Kokoro).',
  );
}

const MIME_TO_FORMAT: Record<string, string> = {
  'text/markdown': 'markdown',
  'text/html': 'html',
  'text/plain': 'plain',
  'text/csv': 'csv',
  'application/json': 'json',
  'application/x-yaml': 'yaml',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/epub+zip': 'epub',
  'application/x-latex': 'latex',
  'application/pdf': 'pdf',
};

function mimeTypeToSimple(mime: string): string {
  const base = mime.split(';')[0].trim();
  return MIME_TO_FORMAT[base] || 'markdown';
}

function outputMimeType(format: string): string {
  const FORMAT_TO_MIME: Record<string, string> = {
    html: 'text/html',
    html5: 'text/html',
    markdown: 'text/markdown',
    md: 'text/markdown',
    plain: 'text/plain',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    epub: 'application/epub+zip',
    latex: 'application/x-latex',
    json: 'application/json',
    yaml: 'application/x-yaml',
    csv: 'text/csv',
    pdf: 'application/pdf',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    odt: 'application/vnd.oasis.opendocument.text',
    rst: 'text/x-rst',
    asciidoc: 'text/x-asciidoc',
    mediawiki: 'text/mediawiki',
    org: 'text/x-org',
    gfm: 'text/markdown',
    commonmark: 'text/markdown',
  };
  return FORMAT_TO_MIME[format] || 'application/octet-stream';
}
