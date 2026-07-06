'use client';

import { useEffect, useState } from 'react';

export function useLiveLogs() {
  const [logs, setLogs] = useState<unknown[]>([]);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    if (!isLive) return;

    const eventSource = new EventSource('/api/v1/logs/stream');

    eventSource.onmessage = (event) => {
      try {
        const newLog = JSON.parse(event.data);
        setLogs((prev) => [newLog, ...prev.slice(0, 99)]);
      } catch (e) {
        console.error('Error parseando log en tiempo real:', e);
      }
    };

    eventSource.onerror = () => {
      console.error('Error en conexión SSE de logs');
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [isLive]);

  return { logs, isLive, setIsLive, clearLogs: () => setLogs([]) };
}
