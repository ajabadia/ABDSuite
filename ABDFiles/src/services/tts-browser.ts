/**
 * @purpose Gestiona la funcionalidad de síntesis de voz en el navegador, proporcionando métodos sincrónicos y asíncronos para la síntesis de habla.
 * @purpose_en Manages text-to-speech functionality in the browser, providing both synchronous and asynchronous methods for speech synthesis.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:5,imports:0,sig:10l5zsw
 * @lastUpdated 2026-06-28T08:33:49.419Z
 */

export interface TtsBrowserOptions {
  voice?: string;
  speed?: number;
}

export interface TtsBrowserResult {
  blob: Blob;
  mimeType: string;
  duration: number;
}

export function isBrowserTtsSupported(): boolean {
  return typeof window !== 'undefined' && typeof SpeechSynthesis !== 'undefined';
}

export async function speakWithWebSpeech(text: string, options: TtsBrowserOptions = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!isBrowserTtsSupported()) {
      reject(new Error('Web Speech API is not supported in this browser.'));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.speed || 1;

    if (options.voice) {
      const voices = speechSynthesis.getVoices();
      const match = voices.find((v) => v.name === options.voice);
      if (match) utterance.voice = match;
    }

    utterance.onend = () => resolve();
    utterance.onerror = (e) => reject(new Error(e.error || 'Speech synthesis error'));

    speechSynthesis.speak(utterance);
  });
}

export async function synthesizeAudioLocally(
  text: string,
  options: TtsBrowserOptions = {},
): Promise<TtsBrowserResult> {
  const mod = await import('kokoro-js');
  const { KokoroTTS } = mod;

  const tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-ONNX', {
    dtype: 'q8',
    device: 'wasm',
    progress_callback: (p) => {
      if (typeof window !== 'undefined' && 'progress' in p) {
        window.dispatchEvent(
          new CustomEvent('tts-model-progress', {
            detail: { progress: p.progress, phase: 'loading' },
          }),
        );
      }
    },
  });

  const rawAudio = await tts.generate(text, {
    voice: (options.voice || 'af_heart') as string,
    speed: options.speed || 1,
  });

  const wavBuffer = rawAudio.toWav();
  const blob = new Blob([wavBuffer], { type: 'audio/wav' });
  const duration = rawAudio.audio.length / rawAudio.sampling_rate;

  return { blob, mimeType: 'audio/wav', duration };
}
