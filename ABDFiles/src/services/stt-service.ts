/**
 * @purpose Gestiona la conversión de texto a voz y forma los resultados.
 * @purpose_en ** Manages speech-to-text conversion and formats the results.
 * @refactorable ** true (contains too many state variables and UI parts)
 * @classification ** Business Service
 * @complexity ** Medium
 * @fingerprint exports:6,imports:3,sig:13p3u33
 * @lastUpdated 2026-06-28T08:33:47.784Z
 */

import { pipeline, type Pipeline } from '@xenova/transformers';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

export interface SttOptions {
  model?: 'tiny.en' | 'tiny' | 'base.en' | 'base' | 'small.en' | 'small';
  language?: string;
  timestamps?: boolean;
}

export interface SttResult {
  text: string;
  chunks?: Array<{ timestamp: number[]; text: string }>;
  language?: string;
}

const CDN_BASE = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
const STT_OUTPUTS = ['text', 'srt', 'vtt'];

export function isSttMime(mimeType: string): boolean {
  const base = mimeType.split(';')[0].trim();
  return base.startsWith('audio/') || base.startsWith('video/');
}

export function isSttOutput(to: string): boolean {
  return STT_OUTPUTS.includes(to);
}

let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoading: Promise<void> | null = null;

async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance && ffmpegLoading === null) return ffmpegInstance;

  if (!ffmpegLoading) {
    ffmpegLoading = (async () => {
      const ffmpeg = new FFmpeg();
      await ffmpeg.load({
        coreURL: await toBlobURL(`${CDN_BASE}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${CDN_BASE}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      ffmpegInstance = ffmpeg;
    })();
  }

  await ffmpegLoading;
  ffmpegLoading = null;
  return ffmpegInstance!;
}

async function convertToWav(input: Buffer, inputMime: string): Promise<Buffer> {
  const ffmpeg = await getFFmpeg();
  const ext = inputMime.split('/')[1] || 'wav';
  const inputName = `stt_input.${ext}`;
  const outputName = 'stt_output.wav';

  ffmpeg.writeFile(inputName, new Uint8Array(input));
  await ffmpeg.exec(['-i', inputName, '-vn', '-ar', '16000', '-ac', '1', '-sample_fmt', 's16', '-y', outputName]);
  const data = await ffmpeg.readFile(outputName);
  ffmpeg.deleteFile(inputName);
  ffmpeg.deleteFile(outputName);
  return Buffer.from(data as Uint8Array);
}

function wavToFloat32(wav: Buffer): Float32Array {
  let offset = 12;
  while (offset < wav.length) {
    const chunkId = wav.toString('ascii', offset, offset + 4);
    const chunkSize = wav.readUInt32LE(offset + 4);
    if (chunkId === 'data') {
      const pcm = wav.subarray(offset + 8, offset + 8 + chunkSize);
      const samples = new Float32Array(pcm.length / 2);
      for (let i = 0; i < samples.length; i++) {
        samples[i] = pcm.readInt16LE(i * 2) / 32768.0;
      }
      return samples;
    }
    offset += 8 + chunkSize;
  }
  throw new Error('Could not find data chunk in WAV');
}

function formatSrt(chunks: Array<{ timestamp: number[]; text: string }>): string {
  const fmt = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const ms = Math.round((s - Math.floor(s)) * 1000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(Math.floor(s)).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
  };
  return chunks
    .map((c, i) => `${i + 1}\n${fmt(c.timestamp[0])} --> ${fmt(c.timestamp[1])}\n${c.text.trim()}\n`)
    .join('\n');
}

function formatVtt(chunks: Array<{ timestamp: number[]; text: string }>): string {
  const fmt = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const ms = Math.round((s - Math.floor(s)) * 1000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(Math.floor(s)).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
  };
  return 'WEBVTT\n\n' + chunks
    .map((c) => `${fmt(c.timestamp[0])} --> ${fmt(c.timestamp[1])}\n${c.text.trim()}\n`)
    .join('\n');
}

let whisperPipeline: Pipeline | null = null;
let pipelineLoading: Promise<void> | null = null;

async function getWhisperPipeline(model: string): Promise<Pipeline> {
  if (whisperPipeline && pipelineLoading === null) return whisperPipeline;

  if (!pipelineLoading) {
    pipelineLoading = (async () => {
      whisperPipeline = await pipeline('automatic-speech-recognition', model);
    })();
  }

  await pipelineLoading;
  pipelineLoading = null;
  return whisperPipeline!;
}

export async function transcribeAudio(
  input: Buffer,
  inputMime: string,
  options: SttOptions = {},
): Promise<SttResult> {
  const wav = await convertToWav(input, inputMime);
  const audioData = wavToFloat32(wav);

  const modelName = `Xenova/whisper-${options.model || 'tiny.en'}`;
  const transcriber = await getWhisperPipeline(modelName);

  const result: { text: string; chunks?: Array<{ timestamp: number[]; text: string }> } = await transcriber(audioData, {
    return_timestamps: options.timestamps ?? true,
    language: options.language,
  });

  return {
    text: result.text,
    chunks: result.chunks,
    language: options.language,
  };
}

export function formatSttOutput(result: SttResult, to: string): { output: string; mimeType: string } {
  if (to === 'srt' && result.chunks) {
    return { output: formatSrt(result.chunks), mimeType: 'text/srt' };
  }
  if (to === 'vtt' && result.chunks) {
    return { output: formatVtt(result.chunks), mimeType: 'text/vtt' };
  }
  return { output: result.text, mimeType: 'text/plain' };
}
