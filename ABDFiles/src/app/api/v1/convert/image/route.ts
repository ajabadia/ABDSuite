/**
 * @purpose Gestiona conversión de imágenes, validando formatos de entrada y salida y procesando la conversión utilizando un motor especificado.
 * @purpose_en Handles image conversion requests, validating input and output formats, and processing the conversion using a specified engine.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:5,imports:3,sig:1rbb4ot
 * @lastUpdated 2026-06-28T08:33:10.979Z
 */

import { NextRequest, NextResponse } from 'next/server';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';
import { convertImage, isImageMime, isImageOutputFormat, type ImageConvertOptions } from '@/services/image-service';

export const revalidate = 0;
export const maxDuration = 120;

export async function OPTIONS() {
  return NextResponse.json({ methods: ['GET', 'POST', 'OPTIONS'] });
}

export async function GET() {
  return NextResponse.json({
    engine: 'sharp',
    formats: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/tiff', 'image/gif', 'image/heif'],
    options: ['width', 'height', 'quality', 'fit (cover|contain|fill|inside|outside)'],
  });
}

export async function POST(request: NextRequest) {
  try {
    await ensureIndustrialAccess();

    const body = await request.json();
    const { content, mimeType, to, width, height, quality, fit } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid content' }, { status: 400 });
    }

    const baseMime = (mimeType || '').split(';')[0].trim();
    if (content && !isImageMime(baseMime)) {
      return NextResponse.json({ error: 'Invalid image mime type' }, { status: 400 });
    }

    const targetFormat = to || 'image/png';
    if (!isImageOutputFormat(targetFormat)) {
      return NextResponse.json({ error: `Unsupported image format: ${targetFormat}` }, { status: 400 });
    }

    const inputBuffer = Buffer.from(content, 'base64');
    const options: ImageConvertOptions = { to: targetFormat, width, height, quality, fit };
    const result = await convertImage(inputBuffer, baseMime, options);

    return NextResponse.json({
      output: result.output.toString('base64'),
      mimeType: result.mimeType,
      width: result.width,
      height: result.height,
      engine: 'sharp',
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
