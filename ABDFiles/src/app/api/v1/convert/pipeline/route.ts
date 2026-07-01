/**
 * @purpose Gestiona solicitudes HTTP para operaciones de conversión de flujo, incluyendo métodos GET y POST para obtener información del flujo y ejecutar conversiones respectivamente.
 * @purpose_en Handles HTTP requests for pipeline conversion operations, including GET and POST methods to retrieve pipeline information and execute conversions respectively.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:5,imports:3,sig:n5y1xd
 * @lastUpdated 2026-06-28T08:33:16.719Z
 */

import { NextRequest, NextResponse } from 'next/server';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';
import { resolvePipeline, executePipeline, type PipelineStep } from '@/services/pipeline-router';

export const revalidate = 0;
export const maxDuration = 300;

export async function OPTIONS() {
  return NextResponse.json({ methods: ['GET', 'POST', 'OPTIONS'] });
}

export async function GET() {
  return NextResponse.json({
    engine: 'pipeline-router',
    description: 'Multi-step conversion pipeline. Detects chains automatically or accepts explicit steps.',
    pipelines: [
      { name: 'Media → Document', steps: ['FFmpeg → Whisper → Pandoc'], input: 'audio/*, video/*', output: 'docx, pdf, html, markdown, ...' },
      { name: 'OCR → Document', steps: ['Tesseract → Pandoc'], input: 'image/* + ocr:true, application/pdf + ocr:true', output: 'docx, pdf, html, ...' },
    ],
    input: ['audio/*', 'video/*', 'image/*', 'application/pdf'],
    output: ['docx', 'pdf', 'html', 'markdown', 'plain', 'epub', 'latex', 'pptx', 'odt'],
    options: ['steps (explicit array)', 'language', 'standalone', 'toc', 'voice', 'speed'],
  });
}

export async function POST(request: NextRequest) {
  try {
    await ensureIndustrialAccess();

    const body = await request.json();
    const { content, mimeType, to, steps, language, standalone, toc, voice, speed } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid content' }, { status: 400 });
    }

    const baseMime = (mimeType || '').split(';')[0].trim();

    const pipelineSteps: PipelineStep[] | null = steps
      ? (steps as PipelineStep[])
      : resolvePipeline({
          inputMime: baseMime,
          outputTo: to || 'html',
          ocr: body.ocr === true,
          language,
          standalone,
          toc,
        });

    if (!pipelineSteps || pipelineSteps.length === 0) {
      return NextResponse.json({
        error: 'No pipeline found for the given input/output. Provide explicit "steps" or use a valid input/output combination.',
      }, { status: 400 });
    }

    const result = await executePipeline(content, baseMime, pipelineSteps);
    const isText = result.mimeType.startsWith('text/');

    return NextResponse.json({
      output: isText
        ? Buffer.from(result.output, 'base64').toString('utf-8')
        : result.output,
      mimeType: result.mimeType,
      steps: result.steps,
      engine: result.engine,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
