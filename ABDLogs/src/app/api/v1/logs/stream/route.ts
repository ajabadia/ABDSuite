import { NextResponse } from 'next/server';
import { logEventEmitter } from '@/lib/log-event-bus';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { signal } = request;
  let onNewLog: ((data: unknown) => void) | null = null;
  let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  const cleanup = () => {
    if (onNewLog) {
      logEventEmitter.off('new_log', onNewLog);
      onNewLog = null;
    }
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
  };

  const responseStream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      onNewLog = (logData: unknown) => {
        const sseMessage = `data: ${JSON.stringify(logData)}\n\n`;
        controller.enqueue(encoder.encode(sseMessage));
      };

      logEventEmitter.on('new_log', onNewLog);

      heartbeatInterval = setInterval(() => {
        controller.enqueue(encoder.encode(': heartbeat\n\n'));
      }, 15000);
    },
    cancel() {
      cleanup();
    },
  });

  signal.addEventListener('abort', () => {
    cleanup();
  });

  return new NextResponse(responseStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
