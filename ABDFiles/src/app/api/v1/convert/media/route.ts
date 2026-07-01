/**
 * @purpose Gestiona solicitudes de conversión de medios utilizando FFmpeg.
 * @purpose_en Handles media conversion requests using FFmpeg.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:5,imports:3,sig:1mpiqd2
 * @lastUpdated 2026-06-28T08:33:12.067Z
 */

import { NextRequest, NextResponse } from 'next/server';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';
import { convertMedia, isMediaMime, isMediaOutput, type MediaOptions, type MediaResult } from '@/services/media-service';

export const revalidate = 0;
export const maxDuration = 120;

export async function OPTIONS() {
  return NextResponse.json({ methods: ['GET', 'POST', 'OPTIONS'] });
}

export async function GET() {
  return NextResponse.json({
    engine: 'ffmpeg',
    inputFormats: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/aac', 'audio/m4a', 'audio/webm'],
    inputVideoFormats: ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mkv', 'video/mov'],
    outputAudio: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/aac'],
    outputVideo: ['video/mp4', 'video/webm'],
    options: ['audioBitrate', 'videoBitrate'],
  });
}

export async function POST(request: NextRequest) {
  try {
    await ensureIndustrialAccess();

    const body = await request.json();
    const { content, mimeType, to, audioBitrate, videoBitrate } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid content' }, { status: 400 });
    }

    const baseMime = (mimeType || '').split(';')[0].trim();
    if (!isMediaMime(baseMime)) {
      return NextResponse.json({ error: `Media conversion not supported for mime type: ${baseMime}` }, { status: 400 });
    }

    const target = to || 'audio/wav';
    if (!isMediaOutput(target)) {
      return NextResponse.json({ error: `Unsupported media output format: ${target}` }, { status: 400 });
    }

    const inputBuffer = Buffer.from(content, 'base64');
    const options: MediaOptions = { to: target, audioBitrate, videoBitrate };
    const result: MediaResult = await convertMedia(inputBuffer, baseMime, options);

    return NextResponse.json({
      output: result.output.toString('base64'),
      mimeType: result.mimeType,
      engine: 'ffmpeg',
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
