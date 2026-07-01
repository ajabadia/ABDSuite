/**
 * @purpose Gestiona la conversión de documentos utilizando Pandoc, proporcionando información sobre formatos soportados y convirtiendo documentos según las opciones proporcionadas.
 * @purpose_en Handles document conversion using Pandoc, providing information about supported formats and converting documents based on provided options.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:5,imports:3,sig:2sal8b
 * @lastUpdated 2026-06-28T08:33:15.374Z
 */

import { NextRequest, NextResponse } from 'next/server';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';
import { convertDocument, getPandocInfo, type ConvertOptions } from '@/services/pandoc-service';

export const revalidate = 0;
export const maxDuration = 120;

export async function OPTIONS() {
  return NextResponse.json({ methods: ['GET', 'POST', 'OPTIONS'] });
}

export async function GET() {
  const info = await getPandocInfo();
  return NextResponse.json({
    engine: 'pandoc-' + info.version,
    version: info.version,
    inputFormats: info.inputFormats,
    outputFormats: info.outputFormats,
  });
}

export async function POST(request: NextRequest) {
  try {
    await ensureIndustrialAccess();

    const body = await request.json();
    const { content, mimeType, from, to, standalone, toc } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid content' }, { status: 400 });
    }

    if (!to || typeof to !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid target format (to)' }, { status: 400 });
    }

    const options: ConvertOptions = {
      from: from as ConvertOptions['from'],
      to: to as ConvertOptions['to'],
      standalone,
      toc,
    };

    const result = await convertDocument(content, mimeType || 'text/plain', options);

    const mimeTypeMap: Record<string, string> = {
      html: 'text/html', html5: 'text/html',
      markdown: 'text/markdown', md: 'text/markdown',
      plain: 'text/plain',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      epub: 'application/epub+zip',
      latex: 'application/x-latex',
      pdf: 'application/pdf',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      odt: 'application/vnd.oasis.opendocument.text',
    };

    return NextResponse.json({
      output: result.output,
      mimeType: mimeTypeMap[to] || 'text/plain',
      warnings: result.warnings,
      engine: 'pandoc',
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
