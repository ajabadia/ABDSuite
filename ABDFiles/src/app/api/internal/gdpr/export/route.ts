/**
 * @purpose Gestiona la solicitud POST para exportar datos de usuarios GDPR, valida los datos de entrada, autentica la solicitud y devuelve un archivo ZIP con los datos de usuario.
 * @purpose_en Handles the POST request for GDPR user data export, validates input, authenticates the request, and returns a zip file containing user data.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:1,imports:3,sig:1v5vd5a
 * @lastUpdated 2026-07-02T18:45:13.403Z
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GDPRService } from '@/services/gdpr-service';

const ExportSchema = z.object({
  tenantId: z.string().min(1),
  userId: z.string().min(1),
  email: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const secret = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    if (!secret || secret !== process.env.ABD_INTERNAL_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const raw = await request.json();
    const body = ExportSchema.parse(raw);

    const zipBuffer = await GDPRService.exportUserData(body.tenantId, body.userId);

    return new NextResponse(zipBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="gdpr-export-${body.tenantId}-${body.userId}.zip"`,
      },
    });
  } catch (error) {
    console.error('[ABDFiles_GDPR_EXPORT_ERROR]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
