import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@ajabadia/satellite-sdk/db';
import AnalyticsEvent from '@/models/AnalyticsEvent';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventType, metadata, clientIp, timestamp } = body;

    await connectDB();

    await AnalyticsEvent.create({
      eventId: crypto.randomUUID(),
      eventType: eventType || 'Unknown',
      metadata: metadata || {},
      clientIp,
      createdAt: timestamp ? new Date(timestamp) : new Date(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[ANALYTICS_INGEST_ERROR]', error);
    return NextResponse.json({ ok: true });
  }
}
