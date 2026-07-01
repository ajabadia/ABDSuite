/**
 * @purpose Gestiona tareas de procesamiento de medios utilizando FFmpeg, incluyendo transcodificación y conversión de formato.
 * @purpose_en Manages media processing tasks using FFmpeg, including transcoding and format conversion.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:7,imports:2,sig:n126g4
 * @lastUpdated 2026-06-28T08:33:38.041Z
 */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';

export interface MediaOptions {
  to: string;
  audioBitrate?: string;
  videoBitrate?: string;
}

export interface MediaResult {
  output: Buffer;
  mimeType: string;
}

const CDN_BASE = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

const AUDIO_MIME_MAP: Record<string, string> = {
  'audio/mp3': 'mp3',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/wave': 'wav',
  'audio/ogg': 'ogg',
  'audio/flac': 'flac',
  'audio/aac': 'aac',
  'audio/webm': 'webm',
  'audio/m4a': 'm4a',
};

const VIDEO_MIME_MAP: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/ogg': 'ogv',
  'video/avi': 'avi',
  'video/mkv': 'mkv',
  'video/mov': 'mov',
};

function mimeToExt(mime: string): string {
  return AUDIO_MIME_MAP[mime] || VIDEO_MIME_MAP[mime] || mime.split('/')[1] || 'mp3';
}

export function isAudioMime(mimeType: string): boolean {
  const base = mimeType.split(';')[0].trim();
  return base.startsWith('audio/');
}

export function isVideoMime(mimeType: string): boolean {
  const base = mimeType.split(';')[0].trim();
  return base.startsWith('video/');
}

export function isMediaMime(mimeType: string): boolean {
  return isAudioMime(mimeType) || isVideoMime(mimeType);
}

export function isMediaOutput(to: string): boolean {
  return to.startsWith('audio/') || to.startsWith('video/');
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

export async function convertMedia(
  input: Buffer,
  inputMime: string,
  options: MediaOptions,
): Promise<MediaResult> {
  const ffmpeg = await getFFmpeg();

  const inputExt = mimeToExt(inputMime);
  const outputExt = mimeToExt(options.to);
  const inputName = `input.${inputExt}`;
  const outputName = `output.${outputExt}`;

  ffmpeg.writeFile(inputName, new Uint8Array(input));

  const args = ['-i', inputName];

  if (inputMime.startsWith('video/') && options.to.startsWith('audio/')) {
    args.push('-vn');
  }

  if (options.audioBitrate) {
    args.push('-b:a', options.audioBitrate);
  }
  if (options.videoBitrate) {
    args.push('-b:v', options.videoBitrate);
  }

  if (options.to.startsWith('audio/mp3') || options.to.startsWith('audio/mpeg')) {
    args.push('-acodec', 'libmp3lame');
  } else if (options.to.startsWith('audio/ogg')) {
    args.push('-acodec', 'libvorbis');
  } else if (options.to.startsWith('audio/flac')) {
    args.push('-acodec', 'flac');
  } else if (options.to.startsWith('audio/aac')) {
    args.push('-acodec', 'aac');
  } else if (options.to.startsWith('audio/wav')) {
    args.push('-acodec', 'pcm_s16le');
  }

  args.push('-y', outputName);

  await ffmpeg.exec(args);

  const data = await ffmpeg.readFile(outputName);

  ffmpeg.deleteFile(inputName);
  ffmpeg.deleteFile(outputName);

  const result = data as Uint8Array;

  return {
    output: Buffer.from(result),
    mimeType: options.to,
  };
}
