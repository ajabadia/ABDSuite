/**
 * @purpose Gestiona las operaciones de conversión de imágenes utilizando la biblioteca Sharp, apoyando varios formatos y opciones como el ajuste de calidad y la redimensionamiento.
 * @purpose_en Handles image conversion operations using the Sharp library, supporting various formats and options like resizing and quality adjustments.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:5,imports:1,sig:56wg9w
 * @lastUpdated 2026-06-28T08:33:35.350Z
 */

import sharp, { type Sharp } from 'sharp';

export interface ImageConvertOptions {
  to: string;
  width?: number;
  height?: number;
  quality?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

export interface ImageConvertResult {
  output: Buffer;
  mimeType: string;
  width: number;
  height: number;
}

const FORMAT_TO_MIME: Record<string, string> = {
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  tiff: 'image/tiff',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  heif: 'image/heif',
};

export function isImageMime(mimeType: string): boolean {
  const base = mimeType.split(';')[0].trim();
  return base.startsWith('image/');
}

export function isImageOutputFormat(format: string): boolean {
  return format.startsWith('image/') || Object.keys(FORMAT_TO_MIME).includes(format);
}

export async function convertImage(
  input: Buffer,
  mimeType: string,
  options: ImageConvertOptions,
): Promise<ImageConvertResult> {
  const baseMime = mimeType.split(';')[0].trim();

  let pipeline: Sharp = sharp(input);

  const meta = await pipeline.metadata();

  if (options.width || options.height) {
    pipeline = pipeline.resize({
      width: options.width,
      height: options.height,
      fit: options.fit || 'cover',
      withoutEnlargement: true,
    });
  }

  const formatKey = Object.entries(FORMAT_TO_MIME).find(
    ([, mime]) => mime === options.to,
  )?.[0] || options.to;

  const format = formatKey as keyof typeof FORMAT_TO_MIME;

  switch (format) {
    case 'jpeg':
    case 'jpg':
      pipeline = pipeline.jpeg({ quality: options.quality ?? 85 });
      break;
    case 'png':
      pipeline = pipeline.png({ quality: options.quality ?? 85 });
      break;
    case 'webp':
      pipeline = pipeline.webp({ quality: options.quality ?? 80 });
      break;
    case 'avif':
      pipeline = pipeline.avif({ quality: options.quality ?? 65 });
      break;
    case 'tiff':
      pipeline = pipeline.tiff({ quality: options.quality ?? 85 });
      break;
    case 'gif':
      pipeline = pipeline.gif();
      break;
    case 'heif':
      pipeline = pipeline.heif({ quality: options.quality ?? 80 });
      break;
    default:
      pipeline = pipeline.jpeg({ quality: 85 });
  }

  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });

  return {
    output: data,
    mimeType: FORMAT_TO_MIME[format] || `image/${format}`,
    width: info.width,
    height: info.height,
  };
}
