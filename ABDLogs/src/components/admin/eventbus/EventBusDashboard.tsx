'use client';

/**
 * @purpose Gestiona y renderiza un panel de control para administrar y mostrar métricas de una cola de eventos, incluyendo tipos de eventos, flujos activos, eventos totales y detalles de los flujos.
 * @purpose_en Renders a dashboard for managing and displaying metrics of an event bus, including types of events, active streams, total events, and stream details.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:1,sig:1dbod47
 * @lastUpdated 2026-06-26T06:17:43.108Z
 */

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';

interface StreamInfo {
  eventType: string;
  streamKey: string;
  length: number;
}

interface StreamEventEntry {
  id: string;
  data: Record<string, unknown>;
  timestamp: string;
}

interface EventBusStats {
  eventTypes: number;
  activeStreams: number;
  totalEvents: number;
  streams: StreamInfo[];
  streamDetails?: (StreamInfo & { events: StreamEventEntry[] })[];
}

export function EventBusDashboard() {
  const t = useTranslations('logs');
  const [stats, setStats] = useState<EventBusStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStream, setSelectedStream] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const params = selectedStream ? `?detail=true&stream=${selectedStream}` : '?detail=true';
      const res = await fetch(`/api/admin/eventbus${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [selectedStream]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        {t('loadingMessage')}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        Error: {error}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="flex flex-col gap-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          label={t('eventTypes')}
          value={stats.eventTypes}
          subtitle={t('eventTypesSub')}
        />
        <MetricCard
          label={t('activeStreams')}
          value={stats.activeStreams}
          subtitle={t('activeStreamsSub')}
        />
        <MetricCard
          label={t('totalEvents')}
          value={stats.totalEvents}
          subtitle={t('totalEventsSub')}
        />
      </div>

      {/* Streams Table */}
      <div className="border border-border bg-card/40">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            {t('eventStreamsTitle')}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                <th className="text-left p-4 font-medium">{t('eventTypeHeader')}</th>
                <th className="text-left p-4 font-medium">{t('streamKeyHeader')}</th>
                <th className="text-right p-4 font-medium">{t('lengthHeader')}</th>
                <th className="text-right p-4 font-medium">{t('statusHeader')}</th>
              </tr>
            </thead>
            <tbody>
              {stats.streams.map((stream) => (
                <tr
                  key={stream.eventType}
                  className={`border-b border-border/50 hover:bg-accent/30 cursor-pointer transition-colors ${selectedStream === stream.eventType ? 'bg-accent/40' : ''}`}
                  onClick={() => setSelectedStream(selectedStream === stream.eventType ? null : stream.eventType)}
                >
                  <td className="p-4 font-mono text-xs text-foreground">{stream.eventType}</td>
                  <td className="p-4 font-mono text-xs text-muted-foreground">{stream.streamKey}</td>
                  <td className="p-4 text-right font-mono text-xs">{stream.length}</td>
                  <td className="p-4 text-right">
                    <span className={`inline-block w-2 h-2 rounded-full ${stream.length > 0 ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Events for Selected Stream */}
      {selectedStream && stats.streamDetails && (
        <div className="border border-border bg-card/40">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              {t('recentEventsTitle')}: <span className="text-primary">{selectedStream}</span>
            </h3>
            <button
              onClick={() => setSelectedStream(null)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              aria-label={t('close')}
            >
              {t('close')}
            </button>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider sticky top-0 bg-card">
                  <th className="text-left p-3 font-medium">{t('idHeader')}</th>
                  <th className="text-left p-3 font-medium">{t('timestampLabel')}</th>
                  <th className="text-left p-3 font-medium">{t('payloadHeader')}</th>
                </tr>
              </thead>
              <tbody>
                {stats.streamDetails
                  .find(s => s.eventType === selectedStream)
                  ?.events.map((event) => (
                    <tr key={event.id} className="border-b border-border/30">
                      <td className="p-3 font-mono text-xs text-muted-foreground">{event.id}</td>
                      <td className="p-3 font-mono text-xs text-muted-foreground">{event.timestamp}</td>
                      <td className="p-3">
                        <pre className="font-mono text-xs text-foreground max-w-md truncate">
                          {JSON.stringify(event.data)}
                        </pre>
                      </td>
                    </tr>
                  ))}
                {(!stats.streamDetails.find(s => s.eventType === selectedStream)?.events.length) && (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-muted-foreground text-xs">
                      {t('noRecentEvents')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, subtitle }: { label: string; value: number; subtitle: string }) {
  return (
    <div className="border border-border bg-card/40 p-6 flex flex-col gap-2">
      <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{label}</span>
      <span className="text-4xl font-black text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground">{subtitle}</span>
    </div>
  );
}
