'use client';

import React, { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle, XCircle, Loader2, UserPlus } from 'lucide-react';
import { approveRequestAction, rejectRequestAction, type LeadRecord } from '@/actions/leads-actions';

interface LeadsTableProps {
  requests: LeadRecord[];
}

export function LeadsTable({ requests }: LeadsTableProps) {
  const t = useTranslations('adminPortal');
  const [, startTransition] = useTransition();
  const [processingId, setProcessingId] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState<{ id: string; type: 'success' | 'error'; message: string } | null>(null);

  const handleApprove = (id: string) => {
    setFeedback(null);
    setProcessingId(id);
    startTransition(async () => {
      try {
        const result = await approveRequestAction(id);
        if (!result.success) {
          setFeedback({ id, type: 'error', message: result.message });
        }
      } catch {
        setFeedback({ id, type: 'error', message: 'Unexpected error' });
      } finally {
        setProcessingId(null);
      }
    });
  };

  const handleReject = (id: string) => {
    setFeedback(null);
    setProcessingId(id);
    startTransition(async () => {
      try {
        const result = await rejectRequestAction(id);
        if (!result.success) {
          setFeedback({ id, type: 'error', message: result.message });
        }
      } catch {
        setFeedback({ id, type: 'error', message: 'Unexpected error' });
      } finally {
        setProcessingId(null);
      }
    });
  };

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-4" role="status">
        <UserPlus size={40} className="opacity-30" />
        <p className="text-lg">{t('leadsEmpty')}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-border">
      {feedback && (
        <div
          role="alert"
          className={`px-4 py-3 text-sm flex items-center gap-2 ${
            feedback.type === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'
          }`}
        >
          {feedback.type === 'error' ? <XCircle size={14} /> : <CheckCircle size={14} />}
          {feedback.message}
        </div>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('leadsOrg')}</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('leadsPrefix')}</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('leadsContact')}</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('leadsEmail')}</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('leadsDate')}</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('leadsIp')}</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('leadsStatus')}</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('indexTable.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((req) => (
            <tr key={req._id} className="border-b border-border hover:bg-muted/20 transition-colors">
              <td className="px-4 py-3">{req.organizationName}</td>
              <td className="px-4 py-3 font-mono text-xs">{req.dbPrefix}</td>
              <td className="px-4 py-3">{req.contactName}</td>
              <td className="px-4 py-3">{req.contactEmail}</td>
              <td className="px-4 py-3 text-muted-foreground text-xs">
                {new Date(req.createdAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 text-muted-foreground text-xs font-mono">{req.ipAddress || '-'}</td>
              <td className="px-4 py-3">
                <StatusBadge status={req.status} t={t} />
              </td>
              <td className="px-4 py-3">
                {req.status === 'pending' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(req._id)}
                      disabled={processingId === req._id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={`${t('leadsApprove')} ${req.organizationName}`}
                    >
                      {processingId === req._id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                      {t('leadsApprove')}
                    </button>
                    <button
                      onClick={() => handleReject(req._id)}
                      disabled={processingId === req._id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={`${t('leadsReject')} ${req.organizationName}`}
                    >
                      <XCircle size={12} />
                      {t('leadsReject')}
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status, t }: { status: string; t: (key: string) => string }) {
  const styles: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    approved: 'bg-green-500/20 text-green-400 border-green-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  const labels: Record<string, string> = {
    pending: t('leadsStatusPending'),
    approved: t('leadsStatusApproved'),
    rejected: t('leadsStatusRejected'),
  };
  return (
    <span className={`inline-block px-2 py-0.5 text-xs border ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  );
}
