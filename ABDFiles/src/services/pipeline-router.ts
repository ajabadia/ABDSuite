/**
 * @purpose Gestiona el ejecucion de una pila para procesar medios y documentos, incluyendo transcripcion, OCR, conversión y sintesis de texto a voz.
 * @purpose_en Manages the execution of a pipeline for processing media and documents, including transcription, OCR, conversion, and text-to-speech synthesis.
 * @refactorable true (contains multiple distinct functionalities that could be separated into smaller services)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:5,imports:5,sig:rhctxj
 * @lastUpdated 2026-06-28T08:33:45.405Z
 */

import { convertMedia, isAudioMime, isVideoMime, type MediaOptions } from './media-service';
import { transcribeAudio, isSttOutput, formatSttOutput, type SttOptions } from './stt-service';
import { performOcr, isOcrMime, type OcrOptions } from './ocr-service';
import { convertDocument, type ConvertOptions } from './pandoc-service';
import { synthesizeSpeech, type TtsOptions } from './tts-service';

export interface PipelineStep {
  engine: 'ffmpeg' | 'whisper' | 'tesseract' | 'pandoc' | 'tts';
  to: string;
  options?: Record<string, unknown>;
}

export interface PipelineResult {
  output: string;
  mimeType: string;
  steps: string[];
  engine: string;
}

const DOCUMENT_FORMATS = new Set([
  'html', 'html5', 'markdown', 'md', 'docx', 'pdf', 'epub', 'latex', 'pptx', 'odt',
  'rst', 'asciidoc', 'mediawiki', 'org', 'gfm', 'commonmark',
]);

function isDocumentFormat(to: string): boolean {
  return DOCUMENT_FORMATS.has(to);
}

function isPlainTextMime(mimeType: string): boolean {
  const base = mimeType.split(';')[0].trim();
  return base === 'text/plain' || base === 'text/markdown' || base === 'text/html';
}

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
  text: 'text/plain',
  srt: 'text/srt',
  vtt: 'text/vtt',
};

function mimeFor(to: string): string {
  return FORMAT_TO_MIME[to] || 'application/octet-stream';
}

type ResolveContext = {
  inputMime: string;
  outputTo: string;
  ocr?: boolean;
  language?: string;
  standalone?: boolean;
  toc?: boolean;
};

export function resolvePipeline(ctx: ResolveContext): PipelineStep[] | null {
  const baseMime = ctx.inputMime.split(';')[0].trim();
  const isMedia = isAudioMime(baseMime) || isVideoMime(baseMime);
  const isOcr = ctx.ocr === true && isOcrMime(baseMime);

  // Case 1: Media (audio/video) → document format (docx, pdf, html, etc.)
  //   Pipeline: FFmpeg → Whisper → Pandoc
  if (isMedia && isDocumentFormat(ctx.outputTo)) {
    return [
      { engine: 'ffmpeg', to: 'audio/wav' },
      { engine: 'whisper', to: 'text', options: { language: ctx.language } },
      { engine: 'pandoc', to: ctx.outputTo, options: { standalone: ctx.standalone, toc: ctx.toc } },
    ];
  }

  // Case 2: OCR image/PDF → document format (not plain text)
  //   Pipeline: Tesseract → Pandoc
  if (isOcr && isDocumentFormat(ctx.outputTo) && ctx.outputTo !== 'plain') {
    return [
      { engine: 'tesseract', to: 'text', options: { language: ctx.language } },
      { engine: 'pandoc', to: ctx.outputTo, options: { standalone: ctx.standalone, toc: ctx.toc } },
    ];
  }

  return null;
}

export async function executePipeline(
  content: string,
  mimeType: string,
  steps: PipelineStep[],
): Promise<PipelineResult> {
  let currentContent: string = content;
  let currentMime: string = mimeType;
  const stepNames: string[] = [];

  for (const step of steps) {
    stepNames.push(step.engine);

    switch (step.engine) {
      case 'ffmpeg': {
        const inputBuffer = Buffer.from(currentContent, 'base64');
        const mediaOpts: MediaOptions = {
          to: step.to,
          audioBitrate: step.options?.audioBitrate as string | undefined,
        };
        const result = await convertMedia(inputBuffer, currentMime, mediaOpts);
        currentContent = result.output.toString('base64');
        currentMime = result.mimeType;
        break;
      }

      case 'whisper': {
        const inputBuffer = Buffer.from(currentContent, 'base64');
        const sttOpts: SttOptions = {
          language: step.options?.language as string | undefined,
        };
        const whisperResult = await transcribeAudio(inputBuffer, currentMime, sttOpts);
        const formatted = formatSttOutput(whisperResult, step.to);
        currentContent = Buffer.from(formatted.output, 'utf-8').toString('base64');
        currentMime = formatted.mimeType;
        break;
      }

      case 'tesseract': {
        const inputBuffer = Buffer.from(currentContent, 'base64');
        const ocrOpts: OcrOptions = {
          language: step.options?.language as string | undefined,
        };
        const ocrResult = await performOcr(inputBuffer, ocrOpts);
        currentContent = Buffer.from(ocrResult.text, 'utf-8').toString('base64');
        currentMime = 'text/plain';
        break;
      }

      case 'pandoc': {
        const textContent = Buffer.from(currentContent, 'base64').toString('utf-8');
        const pandocOpts: ConvertOptions = {
          from: (step.options?.from as string) || 'plain',
          to: step.to as ConvertOptions['to'],
          standalone: step.options?.standalone as boolean | undefined,
          toc: step.options?.toc as boolean | undefined,
        };
        const pandocResult = await convertDocument(textContent, currentMime, pandocOpts);
        currentContent = Buffer.from(pandocResult.output, 'utf-8').toString('base64');
        currentMime = mimeFor(step.to);
        break;
      }

      case 'tts': {
        const textContent = Buffer.from(currentContent, 'base64').toString('utf-8');
        const ttsOpts: TtsOptions = {
          voice: step.options?.voice as TtsOptions['voice'],
          speed: step.options?.speed as number | undefined,
        };
        const ttsResult = await synthesizeSpeech(textContent, ttsOpts);
        currentContent = Buffer.from(ttsResult.audio).toString('base64');
        currentMime = ttsResult.mimeType;
        break;
      }
    }
  }

  return {
    output: currentContent,
    mimeType: currentMime,
    steps: stepNames,
    engine: stepNames.join(' → '),
  };
}

export function isPipelineRequired(
  inputMime: string,
  outputTo: string,
  ocr?: boolean,
): boolean {
  const baseMime = inputMime.split(';')[0].trim();
  const isMedia = isAudioMime(baseMime) || isVideoMime(baseMime);
  const isOcr = ocr === true && isOcrMime(baseMime);

  if (isMedia && isDocumentFormat(outputTo)) return true;
  if (isOcr && isDocumentFormat(outputTo) && outputTo !== 'plain') return true;

  return false;
}
