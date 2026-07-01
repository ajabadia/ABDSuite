/**
 * @purpose Gestiona operaciones de OCR en un entorno de navegador.
 * @purpose_en Manages OCR operations in a browser environment.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:3,imports:1,sig:jjcvsg
 * @lastUpdated 2026-06-28T08:33:39.060Z
 */

import { createWorker } from 'tesseract.js';

export interface OcrResult {
  text: string;
  confidence: number;
}

let workerPromise: ReturnType<typeof createWorker> | null = null;
let currentLang: string | null = null;

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof Worker !== 'undefined';
}

export function isBrowserOcrSupported(): boolean {
  return isBrowser();
}

export async function performOcrLocally(
  imageData: Blob | File,
  options: { language?: string } = {},
): Promise<OcrResult> {
  if (!isBrowser()) {
    throw new Error('OCR is only supported in browser environments');
  }

  const lang = options.language || 'eng';

  if (workerPromise && currentLang !== lang) {
    const old = await workerPromise;
    old.terminate();
    workerPromise = null;
  }

  if (!workerPromise) {
    workerPromise = createWorker(lang);
    currentLang = lang;
  }

  const worker = await workerPromise;
  const { data } = await worker.recognize(imageData);

  return {
    text: data.text || '',
    confidence: data.confidence || 0,
  };
}
