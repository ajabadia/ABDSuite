/**
 * @purpose Gestiona la conversión de texto a voz, proporcionando opciones y sintetizando.
 * @purpose_en Handles text-to-speech conversion requests, providing options and processing the synthesis.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:5,imports:3,sig:1ebjz1a
 * @lastUpdated 2026-06-28T08:33:20.647Z
 */

import { NextRequest, NextResponse } from 'next/server';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';
import { synthesizeSpeech, isTtsMime, isTtsOutput, type TtsOptions, type TtsResult } from '@/services/tts-service';

export const revalidate = 0;
export const maxDuration = 120;

export async function OPTIONS() {
  return NextResponse.json({ methods: ['GET', 'POST', 'OPTIONS'] });
}

export async function GET() {
  return NextResponse.json({
    engine: 'kokoro',
    model: 'onnx-community/Kokoro-82M-ONNX',
    voices: [
      'af_heart', 'af_alloy', 'af_aoede', 'af_bella', 'af_jessica',
      'af_kore', 'af_nicole', 'af_nova', 'af_river', 'af_sarah', 'af_sky',
      'am_adam', 'am_echo', 'am_eric', 'am_fenrir', 'am_liam', 'am_michael', 'am_onyx', 'am_puck', 'am_santa',
      'bf_emma', 'bf_isabella', 'bf_alice', 'bf_lily',
      'bm_george', 'bm_lewis', 'bm_daniel', 'bm_fable',
    ],
    input: 'text/plain',
    output: ['audio/wav', 'audio/mp3', 'audio/ogg'],
    options: ['voice', 'speed'],
  });
}

export async function POST(request: NextRequest) {
  try {
    await ensureIndustrialAccess();

    const body = await request.json();
    const { content, voice, speed } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid content' }, { status: 400 });
    }

    const options: TtsOptions = { voice, speed };
    const result: TtsResult = await synthesizeSpeech(content, options);

    return NextResponse.json({
      output: Buffer.from(result.audio).toString('base64'),
      mimeType: result.mimeType,
      duration: result.duration,
      engine: 'kokoro',
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
