import { NextRequest, NextResponse } from 'next/server';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';
import { logger } from '@ajabadia/satellite-sdk/logger';
import FileEvent from '@/models/FileEvent';
import { assertAccess } from '@/lib/abac';

export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assetId: string }> }
) {
  try {
    const user = await ensureIndustrialAccess();
    const { assetId } = await params;
    await assertAccess({
      userId: user.email || 'system',
      tenantId: user.tenantId,
      resource: 'document/' + assetId,
      action: 'audit',
    });

    const events = await FileEvent.find({ tenantId: user.tenantId, fileId: assetId }).sort({
      createdAt: -1,
    });

    return NextResponse.json(events);
  } catch (error: unknown) {
    const err = error as Error;
    console.error('[GET_FILE_EVENTS_ERROR]', error);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
