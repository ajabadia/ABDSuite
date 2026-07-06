import { NextResponse } from 'next/server';

const ANALYTICS_URL = process.env.ANALYTICS_BASE_URL || 'http://localhost:5004';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const clientIp = request.headers.get('x-forwarded-for') || undefined;

  const payload = {
    eventType: body.eventType || 'Unknown',
    metadata: body.metadata || {},
    clientIp,
    timestamp: new Date().toISOString(),
  };

  void fetch(`${ANALYTICS_URL}/api/v1/analytics/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {});

  return NextResponse.json({ success: true });
}
