'use client';

import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

interface Soc2ReportDownloadProps {
  tenantId: string;
}

export default function Soc2ReportDownload({ tenantId }: Soc2ReportDownloadProps) {
  const t = useTranslations('adminPortal');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/compliance/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, startDate, endDate }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        toast.error(`${t('soc2GenError')} (${err.error})`);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SOC2-audit-${tenantId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t('downloadSoc2Btn'));
    } catch (err) {
      console.error('[SOC2_DOWNLOAD]', err);
      toast.error(t('soc2GenError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-card border border-border rounded-xl shadow-sm">
      <h3 className="text-base font-bold text-foreground flex items-center gap-2 mb-4">
        <FileDown className="w-4 h-4 text-primary" aria-hidden="true" />
        {t('soc2ReportTitle')}
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        {t('soc2ReportDesc')}
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="soc2-start" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            {t('startDate')}
          </label>
          <input
            id="soc2-start"
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="px-3 py-2 bg-background border border-border text-foreground text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="soc2-end" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            {t('endDate')}
          </label>
          <input
            id="soc2-end"
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="px-3 py-2 bg-background border border-border text-foreground text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
      </div>

      <button
        onClick={handleDownload}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-none hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={t('downloadSoc2Btn')}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        ) : (
          <FileDown className="w-4 h-4" aria-hidden="true" />
        )}
        {loading ? t('generating') : t('downloadSoc2Btn')}
      </button>
    </div>
  );
}
