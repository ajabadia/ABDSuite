/**
 * @purpose Gestiona conversión de archivos de medios utilizando FFmpeg en el navegador.
 * @purpose_en Manages media file conversions using FFmpeg in the browser.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:2,imports:2,sig:16x982n
 * @lastUpdated 2026-06-28T08:33:36.864Z
 */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';

const CDN_BASE = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoading: Promise<void> | null = null;

export function isBrowserMediaSupported(): boolean {
  return typeof window !== 'undefined' && typeof Worker !== 'undefined';
}

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

export async function convertMediaLocally(
  file: File,
  options: { to: string; audioBitrate?: string },
): Promise<Uint8Array> {
  const ffmpeg = await getFFmpeg();

  const inputName = file.name;
  const outputName = `output.${options.to.split('/')[1] || 'mp3'}`;

  const fileData = await fetchFile(file);
  ffmpeg.writeFile(inputName, fileData);

  const args = ['-i', inputName];

  if (file.type.startsWith('video/') && options.to.startsWith('audio/')) {
    args.push('-vn');
  }

  if (options.audioBitrate) {
    args.push('-b:a', options.audioBitrate);
  }

  args.push('-y', outputName);

  await ffmpeg.exec(args);

  const data = await ffmpeg.readFile(outputName);

  ffmpeg.deleteFile(inputName);
  ffmpeg.deleteFile(outputName);

  return data as Uint8Array;
}
