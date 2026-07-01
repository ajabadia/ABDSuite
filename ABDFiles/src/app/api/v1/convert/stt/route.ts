/**
 * @purpose Gestiona solicitudes de transcripción de audio utilizando el motor Whisper.
 * @purpose_en Handles audio transcription requests using the Whisper engine.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:5,imports:3,sig:2q41xn
 * @lastUpdated 2026-06-28T08:33:19.275Z
 */

import { NextRequest, NextResponse } from 'next/server';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';
import { transcribeAudio, isSttMime, isSttOutput, formatSttOutput, type SttOptions, type SttResult } from '@/services/stt-service';

export const revalidate = 0;
export const maxDuration = 120;

export async function OPTIONS() {
  return NextResponse.json({ methods: ['GET', 'POST', 'OPTIONS'] });
}

export async function GET() {
  return NextResponse.json({
    engine: 'whisper',
    models: ['Xenova/whisper-tiny.en', 'Xenova/whisper-tiny', 'Xenova/whisper-base.en', 'Xenova/whisper-base'],
    input: ['audio/*', 'video/*'],
    output: ['text', 'srt', 'vtt'],
    options: ['language', 'model', 'timestamps'],
  });
}

export async function POST(request: NextRequest) {
  try {
    await ensureIndustrialAccess();

    const body = await request.json();
    const { content, mimeType, language, model, timestamps, to } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid content' }, { status: 400 });
    }

    const baseMime = (mimeType || '').split(';')[0].trim();
    if (!isSttMime(baseMime)) {
      return NextResponse.json({ error: `STT not supported for mime type: ${baseMime}` }, { status: 400 });
    }

    const outputFormat = to || 'text';

    const inputBuffer = Buffer.from(content, 'base64');
    const options: SttOptions = { language, model, timestamps };
    const result: SttResult = await transcribeAudio(inputBuffer, baseMime, options);
    const formatted = formatSttOutput(result, outputFormat);

    return NextResponse.json({
      output: formatted.output,
      mimeType: formatted.mimeType,
      chunks: result.chunks,
      language: result.language,
      engine: 'whisper',
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
