/**
 * @purpose Gestiona solicitudes HTTP para operaciones de conversión de archivos.
 * @purpose_en Handles HTTP requests for file conversion operations.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:5,imports:3,sig:ls0ht0
 * @lastUpdated 2026-06-28T08:33:17.976Z
 */

import { NextRequest, NextResponse } from 'next/server';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';
import { routeConversion } from '@/services/conversion-router';

export const revalidate = 0;
export const maxDuration = 120;

export async function OPTIONS() {
  return NextResponse.json({ methods: ['POST', 'OPTIONS'] });
}

export async function GET() {
  return NextResponse.json({
    version: '1',
    engines: ['pandoc', 'sharp', 'tesseract', 'ffmpeg', 'whisper', 'kokoro'],
    formats: {
      input: {
        text: ['docx', 'epub', 'html', 'markdown', 'latex', 'pdf', 'csv', 'json', 'yaml', 'rst', 'asciidoc', 'mediawiki', 'org', 'plain', 'gfm', 'commonmark'],
        image: ['jpeg', 'png', 'webp', 'avif', 'tiff', 'gif', 'heif'],
        audio: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'webm'],
        video: ['mp4', 'webm', 'ogg', 'avi', 'mkv', 'mov'],
        ocr: ['image/* + ocr:true', 'application/pdf + ocr:true'],
        audio_stt: ['audio/* → text/srt/vtt'],
        tts: ['text → audio/wav'],
      },
      output: {
        text: ['html', 'markdown', 'plain', 'docx', 'epub', 'latex', 'csv', 'json', 'yaml', 'pptx', 'odt', 'rst', 'asciidoc'],
        image: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/tiff', 'image/gif', 'image/heif'],
        audio: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/aac'],
        video: ['video/mp4', 'video/webm'],
        stt: ['text', 'srt', 'vtt'],
      },
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    await ensureIndustrialAccess();

    const body = await request.json();
    const { content, mimeType, from, to, standalone, toc, width, height, quality, fit, ocr, language, audioBitrate, videoBitrate, voice, speed } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid content' }, { status: 400 });
    }

    const result = await routeConversion({
      content,
      mimeType: mimeType || 'text/plain',
      from,
      to: (to || 'html').toLowerCase(),
      standalone,
      toc,
      width,
      height,
      quality,
      fit,
      ocr: ocr === true,
      language,
      audioBitrate,
      videoBitrate,
      voice,
      speed,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
