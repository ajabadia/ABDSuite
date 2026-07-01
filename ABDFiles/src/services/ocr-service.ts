/**
 * @purpose Gestiona operaciones de OCR para imágenes y PDFs, proporcionando extracción de texto con niveles de confianza y información de rectángulo.
 * @purpose_en Manages OCR operations for images and PDFs, providing text extraction with confidence levels and bounding box information.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:5,imports:1,sig:5wyjgv
 * @lastUpdated 2026-06-28T08:33:40.305Z
 */

import { createWorker } from 'tesseract.js';

export interface OcrOptions {
  language?: string;
}

export interface OcrResult {
  text: string;
  confidence: number;
  blocks: Array<{
    text: string;
    confidence: number;
    bbox: { x0: number; y0: number; x1: number; y1: number };
  }>;
}

type TesseractWorker = Awaited<ReturnType<typeof createWorker>>;

let workerPromise: Promise<TesseractWorker> | null = null;
let workerLang: string | null = null;
const DEFAULT_LANG = 'eng';

async function getWorker(language: string): Promise<TesseractWorker> {
  if (workerPromise && workerLang === language) {
    return workerPromise;
  }
  if (workerPromise) {
    const w = await workerPromise;
    await w.terminate();
    workerPromise = null;
  }
  workerPromise = createWorker(language) as Promise<TesseractWorker>;
  workerLang = language;
  return workerPromise;
}

export function isOcrMime(mimeType: string): boolean {
  const base = mimeType.split(';')[0].trim();
  return base.startsWith('image/') || base === 'application/pdf';
}

export async function performOcr(
  input: Buffer,
  options: OcrOptions = {},
): Promise<OcrResult> {
  const lang = options.language || DEFAULT_LANG;
  const worker = await getWorker(lang);

  const { data } = await worker.recognize(input);

  return {
    text: data.text || '',
    confidence: data.confidence || 0,
    blocks: (data.blocks || []).map((block: { text: string; confidence: number; bbox: { x0: number; y0: number; x1: number; y1: number } }) => ({
      text: block.text,
      confidence: block.confidence,
      bbox: block.bbox,
    })),
  };
}

export async function terminateOcr(): Promise<void> {
  if (workerPromise) {
    const w = await workerPromise;
    await w.terminate();
    workerPromise = null;
    workerLang = null;
  }
}
