import { NextResponse } from 'next/server';
import { connectDB, getGlobalModel } from '@ajabadia/satellite-sdk/db';
import { TenantRequest } from '@/models/TenantRequest';
import mongoose from 'mongoose';
import { z } from 'zod';

const registrationSchema = z.object({
  organizationName: z.string().min(3).max(50),
  dbPrefix: z
    .string()
    .regex(/^[a-z0-9]{3,10}$/, 'Database prefix must be 3-10 lowercase alphanumeric characters'),
  contactEmail: z.string().email(),
  contactName: z.string().min(2),
});

const TenantSchema = new mongoose.Schema(
  { tenantId: String, name: String, active: Boolean },
  { collection: 'tenants' }
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registrationSchema.parse(body);

    await connectDB();

    const TenantModel = getGlobalModel('Tenant', TenantSchema, 'AUTH');
    const existingTenant = await TenantModel.findOne({
      tenantId: parsed.dbPrefix,
    }).lean();
    if (existingTenant) {
      return NextResponse.json({ error: 'Database prefix already in use' }, { status: 409 });
    }

    const existingRequest = await TenantRequest.findOne({
      dbPrefix: parsed.dbPrefix,
    }).lean();
    if (existingRequest) {
      return NextResponse.json(
        { error: 'Registration request pending for this prefix' },
        { status: 409 }
      );
    }

    const ipAddress = request.headers.get('x-forwarded-for') || undefined;
    await TenantRequest.create({
      ...parsed,
      ipAddress,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error('[ONBOARDING_REGISTER]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
