'use client';

/**
 * @purpose Renderiza un componente de visualizador de registro vivo que recupera y muestra registros de auditoria en tiempo real.
 * @purpose_en Renders a live log viewer UI component that fetches and displays audit logs in real-time.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:7,sig:11fb18z
 * @lastUpdated 2026-06-26T09:59:32.519Z
 */

// LiveLogViewer component – shared live telemetry UI

import React from 'react';
import { featureFlags } from '../utils/featureFlags.js';
import { useLivePolling } from '../hooks/useLivePolling.js';
import { ActionBadge } from './ActionBadge.js';
import type { AuditLog } from '../types.js';
import { AuditDeltaViewer } from './AuditDeltaViewer.js';
import { Activity, Wifi, WifiOff } from 'lucide-react';

interface LiveLogViewerProps {
  tenantId: string;
  /** Override the global feature flag for live mode on this instance */
  liveModeEnabled?: boolean;
}

export function LiveLogViewer({ tenantId, liveModeEnabled }: LiveLogViewerProps) {
  const t = (key: string, opts?: { defaultMessage?: string }) => opts?.defaultMessage || key;

  const { logs, loading, newLogIds, isLive, toggleLive, lastFetched } = useLivePolling({ tenantId });

  const isLiveMode = liveModeEnabled ?? featureFlags.liveModeEnabled;
  if (!isLiveMode) {
    return <div className="p-4 text-sm text-muted-foreground">Live telemetry is disabled.</div>;
  }

  // Simple table rendering – can be styled further
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          onClick={toggleLive}
          className={`flex items-center gap-1 px-3 py-1 rounded text-sm font-bold ${
            isLive ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'bg-zinc-700/20 border-zinc-600/30 text-zinc-500'
          }`}
        >
          {isLive ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          {isLive ? t('live_on', { defaultMessage: 'Live ON' }) : t('live_off', { defaultMessage: 'Live OFF' })}
        </button>
        {lastFetched && (
          <span className="text-xs text-muted-foreground">
            {t('synced_at', { defaultMessage: 'Sync:' })}{' '}
            {lastFetched.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        )}
      </div>

      {loading ? (
        <div className="p-4">{t('loading', { defaultMessage: 'Loading...' })}</div>
      ) : (
        <div className="grid gap-3">
          {logs.map((log) => {
            const isNew = log._id && newLogIds.has(log._id);
            const logDate = log.createdAt ? new Date(log.createdAt) : null;
            const timeStr = logDate ? logDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';
            const dateStr = logDate ? logDate.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' }) : '';

            return (
              <div
                key={log._id}
                className={`p-3 rounded border transition-colors ${
                  isNew ? 'bg-emerald-100 animate-pulse' : 'bg-card border-border hover:bg-secondary/10'
                }`}
              >
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <ActionBadge action={log.action as string} />
                    <span className="font-mono text-xs bg-background border border-border px-2 py-0.5 rounded">
                      ID: {log._id?.slice(-6) ?? '------'}
                    </span>
                    {log.appId && (
                      <span className="font-mono text-xs uppercase bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded">
                        {log.appId}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {dateStr} {timeStr}
                  </div>
                </div>
                {/* Delta details on expand – simplified */}
                <AuditDeltaViewer log={log} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
