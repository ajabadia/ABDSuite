/**
 * @purpose Gestiona operaciones OCR para imágenes y PDFs, proporcionando detalles del motor y realizando OCR en contenido subido.
 * @purpose_en Handles OCR operations for images and PDFs, providing engine details and performing OCR on uploaded content.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:5,imports:3,sig:o9wuzh
 * @lastUpdated 2026-06-28T08:33:14.037Z
 */

import { NextRequest, NextResponse } from 'next/server';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';
import { performOcr, isOcrMime, type OcrOptions, type OcrResult } from '@/services/ocr-service';

export const revalidate = 0;
export const maxDuration = 120;

export async function OPTIONS() {
  return NextResponse.json({ methods: ['GET', 'POST', 'OPTIONS'] });
}

export async function GET() {
  return NextResponse.json({
    engine: 'tesseract',
    languages: ['eng', 'spa', 'fra', 'deu', 'ita', 'por', 'nld', 'ara', 'rus', 'jpn', 'kor', 'zho', 'heb', 'hin'],
    input: ['image/*', 'application/pdf'],
    output: 'text/plain',
  });
}

export async function POST(request: NextRequest) {
  try {
    await ensureIndustrialAccess();

    const body = await request.json();
    const { content, mimeType, language } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid content' }, { status: 400 });
    }

    const baseMime = (mimeType || '').split(';')[0].trim();
    if (!isOcrMime(baseMime)) {
      return NextResponse.json({ error: `OCR not supported for mime type: ${baseMime}` }, { status: 400 });
    }

    const inputBuffer = Buffer.from(content, 'base64');
    const options: OcrOptions = { language };
    const result: OcrResult = await performOcr(inputBuffer, options);

    return NextResponse.json({
      output: result.text,
      mimeType: 'text/plain',
      confidence: result.confidence,
      blocks: result.blocks,
      engine: 'tesseract',
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
