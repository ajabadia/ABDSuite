/**
 * @purpose Gestiona la síntesis de texto a voz utilizando la biblioteca KokoroTTS, proporcionando opciones para la selección de voz, velocidad y modelo.
 * @purpose_en Manages text-to-speech synthesis using the KokoroTTS library, providing options for voice, speed, and model selection.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:5,imports:2,sig:1n9jj0t
 * @lastUpdated 2026-06-28T08:33:50.732Z
 */

import { KokoroTTS } from 'kokoro-js';
import type { RawAudio } from '@huggingface/transformers';
import type { GenerateOptions } from 'kokoro-js';

export interface TtsOptions {
  voice?: GenerateOptions['voice'];
  speed?: number;
  model?: string;
}

export interface TtsResult {
  audio: ArrayBuffer;
  mimeType: string;
  duration: number;
}

const TTS_OUTPUTS = ['audio/wav', 'audio/mp3', 'audio/ogg'];

export function isTtsMime(mimeType: string): boolean {
  const base = mimeType.split(';')[0].trim();
  return base === 'text/plain' || base === 'text/markdown' || base === 'text/html';
}

export function isTtsOutput(to: string): boolean {
  return TTS_OUTPUTS.includes(to);
}

let ttsInstance: KokoroTTS | null = null;
let ttsLoading: Promise<void> | null = null;

async function getTts(modelId: string): Promise<KokoroTTS> {
  if (ttsInstance && ttsLoading === null) return ttsInstance;

  if (!ttsLoading) {
    ttsLoading = (async () => {
      ttsInstance = await KokoroTTS.from_pretrained(modelId, {
        dtype: 'q8',
        device: 'wasm',
      });
    })();
  }

  await ttsLoading;
  ttsLoading = null;
  return ttsInstance!;
}

export async function synthesizeSpeech(
  text: string,
  options: TtsOptions = {},
): Promise<TtsResult> {
  const modelId = options.model || 'onnx-community/Kokoro-82M-ONNX';
  const tts = await getTts(modelId);

  const rawAudio: RawAudio = await tts.generate(text, {
    voice: options.voice || 'af_heart',
    speed: options.speed || 1,
  });

  const wavBuffer = rawAudio.toWav();
  const duration = rawAudio.audio.length / rawAudio.sampling_rate;

  return {
    audio: wavBuffer,
    mimeType: 'audio/wav',
    duration,
  };
}
