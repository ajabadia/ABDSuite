'use server';

import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';
import { connectDB } from '@ajabadia/satellite-sdk/db';
import { TenantRequest } from '@/models/TenantRequest';
import Tenant from '@/models/Tenant';
import { AuditService } from '@/services/tenant/audit-service';

export interface LeadRecord {
  _id: string;
  organizationName: string;
  dbPrefix: string;
  contactEmail: string;
  contactName: string;
  status: 'pending' | 'approved' | 'rejected';
  ipAddress?: string;
  createdAt: string;
}

export async function getPendingRequestsAction(): Promise<LeadRecord[]> {
  await ensureIndustrialAccess('SUPER_ADMIN');
  await connectDB();
  const docs = await TenantRequest.find().sort({ createdAt: -1 }).lean();
  return docs.map((d) => ({
    _id: String(d._id),
    organizationName: d.organizationName,
    dbPrefix: d.dbPrefix,
    contactEmail: d.contactEmail,
    contactName: d.contactName,
    status: d.status,
    ipAddress: d.ipAddress,
    createdAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : String(d.createdAt),
  }));
}

export async function approveRequestAction(requestId: string): Promise<{ success: boolean; message: string }> {
  try {
    const user = await ensureIndustrialAccess('SUPER_ADMIN');
    await connectDB();

    const request = await TenantRequest.findById(requestId);
    if (!request) return { success: false, message: 'Request not found' };
    if (request.status !== 'pending') return { success: false, message: 'Request already processed' };

    const tenant = new Tenant({
      tenantId: request.dbPrefix,
      name: request.organizationName,
      dbPrefix: request.dbPrefix,
      isolationStrategy: 'COLLECTION_PREFIX',
      active: true,
    });
    await tenant.save();

    await mongoose.connection.collection('users').insertOne({
      email: request.contactEmail,
      name: request.contactName,
      tenantId: request.dbPrefix,
      role: 'ADMIN',
      createdAt: new Date(),
    });

    request.status = 'approved';
    await request.save();

    AuditService.logEvent({
      tenantId: user.tenantId,
      action: 'LEAD_APPROVED',
      entityType: 'TENANT',
      entityId: requestId,
      userId: user.id,
      userEmail: user.email,
      changedFields: { organizationName: request.organizationName, dbPrefix: request.dbPrefix },
    }).catch(() => {});

    revalidatePath('/admin/leads');
    return { success: true, message: 'Lead approved successfully' };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : 'Failed to approve' };
  }
}

export async function rejectRequestAction(requestId: string): Promise<{ success: boolean; message: string }> {
  try {
    const user = await ensureIndustrialAccess('SUPER_ADMIN');
    await connectDB();

    const request = await TenantRequest.findById(requestId);
    if (!request) return { success: false, message: 'Request not found' };
    if (request.status !== 'pending') return { success: false, message: 'Request already processed' };

    request.status = 'rejected';
    await request.save();

    AuditService.logEvent({
      tenantId: user.tenantId,
      action: 'LEAD_REJECTED',
      entityType: 'SYSTEM',
      entityId: requestId,
      userId: user.id,
      userEmail: user.email,
      changedFields: { organizationName: request.organizationName, dbPrefix: request.dbPrefix },
    }).catch(() => {});

    revalidatePath('/admin/leads');
    return { success: true, message: 'Lead rejected successfully' };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : 'Failed to reject' };
  }
}
