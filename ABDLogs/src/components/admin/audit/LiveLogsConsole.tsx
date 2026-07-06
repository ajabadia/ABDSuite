'use client';

import { useLiveLogs } from '@/hooks/useLiveLogs';
import { Wifi, WifiOff, Pause, Play, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function LiveLogsConsole() {
  const { logs, isLive, setIsLive, clearLogs } = useLiveLogs();
  const t = useTranslations('adminPortal');

  const toggleLive = () => setIsLive((prev) => !prev);

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border bg-card/50">
        <div className="flex items-center gap-2.5">
          <div
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest border transition-all ${
              isLive
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                : 'bg-zinc-700/20 border-zinc-600/30 text-zinc-500'
            }`}
          >
            {isLive ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" aria-hidden="true" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" aria-hidden="true" />
                </span>
                <Wifi className="w-3 h-3" aria-hidden="true" />
                {t('live')}
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3" aria-hidden="true" />
                {t('paused')}
              </>
            )}
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">
            {t('logsCount', { count: logs.length })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={clearLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-border text-muted-foreground hover:text-foreground hover:border-border/80 transition-all cursor-pointer"
            title={t('clear')}
            aria-label={t('clear')}
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">{t('clear')}</span>
          </button>

          <button
            onClick={toggleLive}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
              isLive
                ? 'bg-background border-border text-muted-foreground hover:border-amber-500/50 hover:text-amber-400'
                : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20'
            }`}
            aria-label={isLive ? t('pause') : t('resume')}
          >
            {isLive ? <Pause className="w-3.5 h-3.5" aria-hidden="true" /> : <Play className="w-3.5 h-3.5" aria-hidden="true" />}
            {isLive ? t('pause') : t('resume')}
          </button>
        </div>
      </div>

      {/* Logs */}
      <div className="flex flex-col gap-1.5 max-h-[600px] overflow-y-auto">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 rounded-xl border border-border bg-secondary/5 text-center">
            <Wifi className="w-8 h-8 text-muted-foreground/60 mb-3 animate-pulse" aria-hidden="true" />
            <h4 className="text-xs font-bold text-foreground uppercase tracking-widest">
              {t('liveLogsWaiting')}
            </h4>
            <p className="text-[10px] text-muted-foreground mt-1">
              {t('liveLogsDesc')}
            </p>
          </div>
        ) : (
          logs.map((log: unknown, index: number) => {
            const entry = log as {
              _id?: string;
              action?: string;
              appId?: string;
              tenantId?: string;
              userEmail?: string;
              entityType?: string;
              createdAt?: string;
            };
            const isFresh = index < 3;

            return (
              <div
                key={entry._id || index}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border text-xs transition-all duration-500 ${
                  isFresh
                    ? 'border-emerald-500/20 bg-emerald-500/[0.02] -translate-y-0.5'
                    : 'border-border bg-card/30'
                }`}
              >
                <span className="text-[10px] font-mono text-muted-foreground w-14 shrink-0">
                  {entry.createdAt
                    ? new Date(entry.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })
                    : '--:--:--'}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 shrink-0">
                  {entry.appId || '?'}
                </span>
                <span className="font-mono text-foreground truncate min-w-0">
                  {entry.action || 'UNKNOWN'}
                </span>
                <span className="text-muted-foreground truncate min-w-0 hidden sm:block">
                  {entry.userEmail || ''}
                </span>
                <span className="text-[10px] text-muted-foreground/50 shrink-0 ml-auto">
                  {entry.tenantId || ''}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
