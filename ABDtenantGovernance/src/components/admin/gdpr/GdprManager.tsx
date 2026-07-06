'use client';

import React, { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Trash2, CheckCircle, XCircle, Clock, Loader2, RefreshCw, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { initiateGdprPurge, getGdprRequestsAction } from '@/actions/gdpr-actions';

interface GdprRequestData {
  _id: string;
  tenantId: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processedSatellites: string[];
  errorDetails?: string;
  createdAt: string;
  updatedAt: string;
}

const SATELLITE_LABELS: Record<string, string> = {
  files: 'ABDFiles',
  quiz: 'ABDQuiz',
  logs: 'ABDLogs',
};

interface GdprManagerProps {
  initialRequests: GdprRequestData[];
}

export function GdprManager({ initialRequests }: GdprManagerProps) {
  const t = useTranslations('admin.gdpr');
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<GdprRequestData[]>(initialRequests);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim() || !tenantId.trim()) {
      toast.error('User ID and Tenant ID are required');
      return;
    }
    setLoading(true);
    try {
      await initiateGdprPurge(tenantId.trim(), userId.trim());
      toast.success(t('initiateSuccess'));
      setUserId('');
      setTenantId('');
      const updated = await getGdprRequestsAction();
      setRequests(updated as unknown as GdprRequestData[]);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to initiate GDPR purge');
    } finally {
      setLoading(false);
    }
  }, [userId, tenantId, t, router]);

  const statusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} className="text-green-400" aria-hidden="true" />;
      case 'failed': return <XCircle size={16} className="text-red-400" aria-hidden="true" />;
      case 'processing': return <Loader2 size={16} className="text-amber-400 animate-spin" aria-hidden="true" />;
      default: return <Clock size={16} className="text-muted-foreground" aria-hidden="true" />;
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'border-green-500/20 bg-green-500/5 text-green-400',
      failed: 'border-red-500/20 bg-red-500/5 text-red-400',
      processing: 'border-amber-500/20 bg-amber-500/5 text-amber-400',
      pending: 'border-muted/20 bg-muted/5 text-muted-foreground',
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 border text-[10px] uppercase font-mono ${colors[status] || colors.pending}`}>
        {statusIcon(status)}
        {status}
      </span>
    );
  };

  const satelliteDot = (satellite: string, processed: string[]) => {
    const done = processed.includes(satellite);
    return (
      <span
        key={satellite}
        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono uppercase border ${
          done
            ? 'border-green-500/20 bg-green-500/5 text-green-400'
            : 'border-muted/20 bg-muted/5 text-muted-foreground/50'
        }`}
        title={done ? 'Completed' : 'Pending'}
      >
        {done ? <CheckCircle size={10} aria-hidden="true" /> : <Clock size={10} aria-hidden="true" />}
        {SATELLITE_LABELS[satellite] || satellite}
      </span>
    );
  };

  const inputClass = "w-full bg-muted/10 border border-border px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 rounded-none";

  return (
    <div className="flex flex-col gap-8">
      {/* Warning banner */}
      <div className="bg-muted/5 border border-border p-6 flex flex-col md:flex-row gap-5 items-start">
        <ShieldAlert className="w-10 h-10 text-primary shrink-0" />
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            {t('gdprTitle')}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t('gdprSubtitle')}
          </p>
        </div>
      </div>

      {/* Initiate purge form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-lg">
        <div>
          <label htmlFor="gdpr-user-id" className="block text-xs uppercase font-bold tracking-wider text-muted-foreground mb-1">
            {t('userIdCol')}
          </label>
          <input
            id="gdpr-user-id"
            type="text"
            value={userId}
            onChange={e => setUserId(e.target.value)}
            required
            className={inputClass}
            placeholder="user_abc123"
            aria-label={t('userIdCol')}
          />
        </div>
        <div>
          <label htmlFor="gdpr-tenant-id" className="block text-xs uppercase font-bold tracking-wider text-muted-foreground mb-1">
            {t('tenantIdCol')}
          </label>
          <input
            id="gdpr-tenant-id"
            type="text"
            value={tenantId}
            onChange={e => setTenantId(e.target.value)}
            required
            className={inputClass}
            placeholder="tenant-1"
            aria-label={t('tenantIdCol')}
          />
        </div>
        <div className="flex items-center gap-2 p-3 border border-amber-500/30 bg-amber-500/5 text-amber-400 text-xs" role="alert">
          <ShieldAlert size={14} className="shrink-0" aria-hidden="true" />
          <span>{t('warning')}</span>
        </div>
        <button
          type="submit"
          aria-label={t('initiateBtn')}
          disabled={loading}
          className="w-full px-4 py-3 bg-red-600 text-white font-bold text-sm uppercase tracking-wider hover:opacity-90 transition-all disabled:opacity-50 rounded-none inline-flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              {t('initiating')}
            </>
          ) : (
            <>
              <Trash2 size={16} aria-hidden="true" />
              {t('initiateBtn')}
            </>
          )}
        </button>
      </form>

      {/* Historical requests table */}
      <div className="border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/5 flex items-center gap-2">
          <RefreshCw size={14} className="text-primary" aria-hidden="true" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            {t('results')}
          </h3>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/10 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              <th className="p-4">{t('requestId')}</th>
              <th className="p-4">{t('tenantIdCol')}</th>
              <th className="p-4">{t('userIdCol')}</th>
              <th className="p-4">{t('statusCol')}</th>
              <th className="p-4">{t('satellitesCol')}</th>
              <th className="p-4">{t('errorDetails')}</th>
              <th className="p-4">{t('createdAt')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-xs">
            {requests.map((req) => (
              <tr key={req._id} className="hover:bg-muted/5 transition-colors">
                <td className="p-4 font-mono text-primary text-[10px]">{req._id}</td>
                <td className="p-4 font-mono text-muted-foreground">{req.tenantId}</td>
                <td className="p-4 font-mono text-muted-foreground">{req.userId}</td>
                <td className="p-4">{statusBadge(req.status)}</td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1">
                    {Object.keys(SATELLITE_LABELS).map((sat) => satelliteDot(sat, req.processedSatellites))}
                  </div>
                </td>
                <td className="p-4 text-red-400 text-[10px] max-w-[200px] truncate" title={req.errorDetails}>
                  {req.errorDetails || '-'}
                </td>
                <td className="p-4 font-mono text-muted-foreground text-[10px]">
                  {new Date(req.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  {t('noRequests')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
