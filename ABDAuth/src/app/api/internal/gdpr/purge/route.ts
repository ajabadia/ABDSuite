/**
 * @purpose Gestiona la solicitud de purgación para cumplir con la normativa GDPR al anonimizar datos del usuario, eliminar sesiones y eliminar cuentas.
 * @purpose_en Handles the purge request for GDPR compliance by anonymizing user data, deleting sessions, and removing accounts.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:1,imports:2,sig:10puted
 * @lastUpdated 2026-07-03T15:34:03.173Z
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const PurgeSchema = z.object({
  userId: z.string().min(1),
  tenantId: z.string().min(1),
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
    const body = PurgeSchema.parse(raw);

    const { mongoClientPromise } = await import('@/lib/mongodb');
    const client = await mongoClientPromise;
    const db = client.db(process.env.MONGODB_AUTH_DB || 'ABDElevators-Auth');

    // 1. Anonymize user in the `users` collection (Better Auth)
    const { ObjectId } = await import('mongodb');
    let userFilter: unknown = body.userId;
    try {
      userFilter = new ObjectId(body.userId);
    } catch {
      // Keep as string if it isn't a valid ObjectId format
    }
    const userResult = await db.collection('users').updateOne(
      { _id: userFilter as unknown as any },
      {
        $set: {
          email: `gdpr-erased-${body.userId}@redacted.local`,
          name: '[GDPR_ERASED]',
          surname: '[GDPR_ERASED]',
          telephone: '[GDPR_ERASED]',
          position: '[GDPR_ERASED]',
        },
        $unset: { emailVerified: '', verificationToken: '' },
      }
    );

    // 2. Delete sessions for this user
    const sessionResult = await db.collection('sessions').deleteMany({ userId: body.userId });

    // 3. Delete accounts (social logins) for this user
    const accountResult = await db.collection('accounts').deleteMany({ userId: body.userId });

    return NextResponse.json({
      success: true,
      userId: body.userId,
      purged: {
        userAnonymized: userResult.modifiedCount,
        sessionsRemoved: sessionResult.deletedCount,
        accountsRemoved: accountResult.deletedCount,
      }
    });
  } catch (error) {
    console.error('[ABDAuth_GDPR_PURGE_ERROR]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}
