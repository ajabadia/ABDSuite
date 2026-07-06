import { connectDB } from '@ajabadia/satellite-sdk/db';
import { GdprRequest } from '@/models/GdprRequest';

export async function runOrchestrator(requestId: string) {
  await connectDB();

  const req = await GdprRequest.findById(requestId);
  if (!req) return;

  req.status = 'processing';
  await req.save();

  const SATELLITES: Record<string, string | undefined> = {
    files: process.env.FILES_SERVICE_URL,
    quiz: process.env.QUIZ_SERVICE_URL,
    logs: process.env.LOGS_SERVICE_URL,
  };

  for (const [name, url] of Object.entries(SATELLITES)) {
    if (!url || req.processedSatellites.includes(name)) continue;

    try {
      const res = await fetch(`${url}/api/internal/gdpr/purge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.INTERNAL_SERVICE_TOKEN}`
        },
        body: JSON.stringify({ userId: req.userId, tenantId: req.tenantId })
      });

      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);

      req.processedSatellites.push(name);
      await req.save();
    } catch (error: unknown) {
      const err = error as Error;
      req.status = 'failed';
      req.errorDetails = `Failed at satellite ${name}: ${err.message}`;
      await req.save();
      return;
    }
  }

  req.status = 'completed';
  await req.save();
}
