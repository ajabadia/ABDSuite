'use client';

/**
 * @purpose Consola interactiva de GDPR y Portabilidad para exportar datos en ZIP y ejecutar purgas físicas en cascada (derecho al olvido).
 * @purpose_en Interactive GDPR and Portability console to export data in ZIP and perform cascading physical purges.
 * @refactorable false
 * @classification Helper Utility
 * @complexity Low
 * @fingerprint exports:1,imports:5,sig:y01p6x
 * @lastUpdated 2026-06-26T10:21:01.036Z
 */

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { 
  Download, Trash2, ShieldAlert, Check, 
  RefreshCw, AlertTriangle, FileArchive, ArrowRight 
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ConfirmDialog, useConfirmDialog } from '@ajabadia/ecosystem-widgets';

interface Tenant {
  _id?: string;
  tenantId: string;
  name: string;
  industry: string;
  dbPrefix: string;
  isolationStrategy: string;
  active: boolean;
}

interface GdprConsoleProps {
  tenants: Tenant[];
  userRole: string;
}

export function GdprConsole({ tenants, userRole }: GdprConsoleProps) {
  const t = useTranslations('admin.gdpr');
  const router = useRouter();
  const [loadingTenantId, setLoadingTenantId] = useState<string | null>(null);
  
  // Dialog state for purge confirmation
  const purgeDialog = useConfirmDialog<{ id: string; tenantId: string }>({
    onConfirm: async (payload) => {
      if (!payload) return;
      setLoadingTenantId(payload.id);
      
      try {
        const response = await fetch(`/api/admin/tenants/${payload.id}?purge=true`, {
          method: 'DELETE',
        });
        
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Error during tenant purge');
        }
        
        toast.success(t('toastPurgeSuccess', { tenantId: payload.tenantId }));
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error purging tenant');
      } finally {
        setLoadingTenantId(null);
      }
    }
  });

  const isSuperAdmin = userRole === 'SUPER_ADMIN';

  const handlePurgeClick = (id: string, tenantId: string) => {
    if (!isSuperAdmin) {
      toast.error(t('toastSuperAdminOnly'));
      return;
    }
    purgeDialog.trigger({ id, tenantId });
  };

  const [exportForm, setExportForm] = useState({ tenantId: '', userId: '', email: '' });
  const [exporting, setExporting] = useState(false);

  const handleUserExport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exportForm.tenantId || !exportForm.userId) {
      toast.error(t('exportRequiredFields'));
      return;
    }
    setExporting(true);
    try {
      const res = await fetch('/api/admin/gdpr/user-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportForm),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gdpr-export-${exportForm.tenantId}-${exportForm.userId}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t('exportCompleted'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 mt-2">
      {/* Intro info box */}
      <div className="bg-muted/5 border border-border p-6 rounded-none flex flex-col md:flex-row gap-5 items-start">
        <ShieldAlert className="w-10 h-10 text-primary shrink-0" />
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            {t('gdprTitle')}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t('gdprDesc')}
          </p>
        </div>
      </div>

      {/* User-level export section */}
      <div className="border border-border bg-card p-5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3 flex items-center gap-2">
          <FileArchive className="w-4 h-4 text-primary" />
          {t('exportUserDataExtended')}
        </h4>
        <form onSubmit={handleUserExport} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{t('tenantIdCol')}</label>
            <input
              type="text"
              value={exportForm.tenantId}
              onChange={(e) => setExportForm(f => ({ ...f, tenantId: e.target.value }))}
              className="px-3 py-2 border border-border bg-background text-xs font-mono w-40 focus:outline-none focus:border-foreground"
              placeholder="tenant-id"
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{t('userIdCol')}</label>
            <input
              type="text"
              value={exportForm.userId}
              onChange={(e) => setExportForm(f => ({ ...f, userId: e.target.value }))}
              className="px-3 py-2 border border-border bg-background text-xs font-mono w-56 focus:outline-none focus:border-foreground"
              placeholder="user-id"
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{t('emailOptional')}</label>
            <input
              type="email"
              value={exportForm.email}
              onChange={(e) => setExportForm(f => ({ ...f, email: e.target.value }))}
              className="px-3 py-2 border border-border bg-background text-xs font-mono w-48 focus:outline-none focus:border-foreground"
              placeholder="user@example.com"
            />
          </div>
          <button
            type="submit"
            aria-label={t('exportUserData')}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-border hover:border-foreground hover:bg-muted/10 text-[10px] font-mono uppercase tracking-wider transition-all duration-200 cursor-pointer"
          >
            {exporting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 text-primary" />
            )}
            <span>{exporting ? t('exporting') : t('exportUserData')}</span>
          </button>
        </form>
      </div>

      {/* Tenants Table */}
      <div className="border border-border bg-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/10 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              <th className="p-4">{t('organizationHeader')}</th>
              <th className="p-4">Tenant ID</th>
              <th className="p-4">{t('dbPrefixHeader')}</th>
              <th className="p-4">{t('statusHeader')}</th>
              <th className="p-4 text-right">{t('gdprActionsHeader')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-xs">
            {tenants.map((tenant) => (
              <tr key={tenant.tenantId} className="hover:bg-muted/5 transition-colors">
                <td className="p-4">
                  <span className="font-bold text-foreground block">{tenant.name}</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{tenant.industry}</span>
                </td>
                <td className="p-4 font-mono text-primary font-semibold">{tenant.tenantId}</td>
                <td className="p-4 font-mono text-muted-foreground">{tenant.dbPrefix}</td>
                <td className="p-4">
                  {tenant.active ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-[10px] uppercase font-mono">
                      {t('activeLabel')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-rose-500/20 bg-rose-500/5 text-rose-400 text-[10px] uppercase font-mono">
                      {t('inactiveLabel')}
                    </span>
                  )}
                </td>
                <td className="p-4 text-right flex justify-end gap-2">
                  {/* Export ZIP */}
                  <a
                    href={`/api/admin/gdpr/export?tenantId=${tenant.tenantId}`}
                    download
                    className="inline-flex items-center gap-1.5 px-3 py-2 border border-border hover:border-foreground hover:bg-muted/10 text-[10px] font-mono uppercase tracking-wider transition-all duration-200"
                    title={t('exportZip')}
                  >
                    <Download className="w-3.5 h-3.5 text-primary" />
                    <span>{t('exportZip')}</span>
                  </a>

                  {/* Purge Tenant */}
                  <button
                    onClick={() => handlePurgeClick(tenant._id?.toString() || '', tenant.tenantId)}
                    aria-label={t('purgeGdpr')}
                    disabled={loadingTenantId !== null}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 border text-[10px] font-mono uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                      isSuperAdmin 
                        ? 'border-rose-500/30 hover:border-rose-500 hover:bg-rose-500/5 text-rose-400 hover:text-rose-500' 
                        : 'border-border text-muted-foreground/40 cursor-not-allowed opacity-50'
                    }`}
                    title={t('purgeGdpr')}
                  >
                    {loadingTenantId === tenant._id?.toString() ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    <span>{t('rightToForget')}</span>
                  </button>
                </td>
              </tr>
            ))}
            {tenants.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  {t('noOrganizations')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={purgeDialog.open}
        title={t('purgeConfirmTitle')}
        message={t('purgeConfirmMessage', { tenantId: purgeDialog.data?.tenantId || '' })}
        confirmLabel={t('purgeNow')}
        cancelLabel={t('cancelAction')}
        variant="danger"
        isLoading={purgeDialog.isLoading}
        onConfirm={purgeDialog.confirm}
        onCancel={purgeDialog.cancel}
      />
    </div>
  );
}
