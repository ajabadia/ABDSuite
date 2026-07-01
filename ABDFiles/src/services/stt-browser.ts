/**
 * @purpose Gestiona transcripcion de audio utilizando Whisper Web en el navegador.
 * @purpose_en Manages audio transcription using Whisper Web in the browser.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:4,imports:1,sig:106tfh3
 * @lastUpdated 2026-06-28T08:33:46.580Z
 */

import type { WhisperWebLanguage, WhisperWebModel } from '@remotion/whisper-web';

export interface SttBrowserOptions {
  model?: WhisperWebModel;
  language?: string;
}

export interface SttBrowserResult {
  text: string;
  chunks?: Array<{ timestamp: number[]; text: string }>;
}

export function isBrowserSttSupported(): boolean {
  return typeof window !== 'undefined' && typeof SharedArrayBuffer !== 'undefined';
}

export async function transcribeAudioLocally(
  file: File,
  options: SttBrowserOptions = {},
): Promise<SttBrowserResult> {
  const mod = await import('@remotion/whisper-web');
  const { transcribe, canUseWhisperWeb, downloadWhisperModel, resampleTo16Khz } = mod;

  const model = options.model || 'tiny.en';

  const { supported, detailedReason } = await canUseWhisperWeb(model);
  if (!supported) {
    throw new Error(
      'Whisper Web is not supported in this browser.\n' +
      'Reason: ' + (detailedReason || 'unknown') + '\n\n' +
      'This feature requires:\n' +
      '  - A secure context (HTTPS or localhost)\n' +
      '  - Cross-Origin Isolation headers\n' +
      '    (Cross-Origin-Opener-Policy: same-origin,\n' +
      '     Cross-Origin-Embedder-Policy: require-corp)\n' +
      '  - Sufficient storage space for the model (~150 MB)',
    );
  }

  await downloadWhisperModel({
    model,
    onProgress: (p) => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('stt-model-progress', {
            detail: { progress: p.progress, phase: 'download' },
          }),
        );
      }
    },
  });

  const channelWaveform = await resampleTo16Khz({ file });

  const result = await transcribe({
    channelWaveform,
    model,
    language: options.language as WhisperWebLanguage | undefined,
  });

  const fullText = result.transcription.map((t) => t.text).join(' ').trim();
  const chunks = result.transcription.map((t) => ({
    timestamp: [t.offsets.from, t.offsets.to] as number[],
    text: t.text,
  }));

  return {
    text: fullText,
    chunks,
  };
}
