'use server';

import { revalidatePath } from 'next/cache';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';
import { connectDB } from '@ajabadia/satellite-sdk/db';
import { GdprRequest, IGdprRequest } from '@/models/GdprRequest';
import { runOrchestrator } from '@/services/gdpr-orchestrator';

export async function initiateGdprPurge(tenantId: string, userId: string) {
  await ensureIndustrialAccess('SUPER_ADMIN');
  await connectDB();

  const request = await GdprRequest.create({ tenantId, userId });

  runOrchestrator(request._id.toString()).catch((err) => {
    console.error('[GDPR] Orchestrator error:', err);
  });

  revalidatePath('/admin/gdpr');
  return { requestId: request._id.toString() };
}

export async function getGdprRequestsAction(): Promise<IGdprRequest[]> {
  await ensureIndustrialAccess('SUPER_ADMIN');
  await connectDB();

  return GdprRequest.find().sort({ createdAt: -1 }).lean() as unknown as IGdprRequest[];
}
