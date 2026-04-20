/**
 * Industrial Sync Panel (Phase 9 - P2P Decentralized)
 * Provides interface for exporting and importing signed sync packages.
 */
'use client';

import React, { useState } from 'react';
import { DbSyncService } from '@/lib/services/db-sync.service';
import { DownloadIcon, UploadIcon, RefreshIcon, CheckCircleIcon, AlertTriangleIcon } from '../common/Icons';

export const SyncPanel: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(localStorage.getItem('abdfn_last_sync'));
  const [status, setStatus] = useState<{ type: 'SUCCESS' | 'ERROR'; msg: string } | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setStatus(null);
    try {
      const blob = await DbSyncService.exportSuite();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      a.href = url;
      a.download = `ABDFN_SYNC_${timestamp}.abdfn-sync`;
      a.click();
      URL.revokeObjectURL(url);
      
      const now = new Date().toLocaleString();
      setLastSync(now);
      localStorage.setItem('abdfn_last_sync', now);
      setStatus({ type: 'SUCCESS', msg: 'Paquete de sincronización generado.' });
    } catch (err) {
      console.error(err);
      setStatus({ type: 'ERROR', msg: 'Fallo al exportar datos.' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setStatus(null);
    try {
      await DbSyncService.importSuite(file, 'MERGE');
      
      const now = new Date().toLocaleString();
      setLastSync(now);
      localStorage.setItem('abdfn_last_sync', now);
      setStatus({ type: 'SUCCESS', msg: 'Sincronización completada correctamente.' });
      
      // Industrial reload to ensure all proxy DBs are refreshed
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      console.error(err);
      setStatus({ type: 'ERROR', msg: 'Error de reconciliación en la importación.' });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="flex-col" style={{ gap: '20px', padding: '24px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
      <header className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
         <div className="flex-row" style={{ gap: '12px', alignItems: 'center' }}>
            <RefreshIcon size={18} color="var(--primary-color)" />
            <span style={{ fontWeight: '800', fontSize: '0.8rem', letterSpacing: '2px', textTransform: 'uppercase' }}>Sincronización P2P</span>
         </div>
         {lastSync && (
           <span style={{ fontSize: '0.65rem', opacity: 0.5 }}>ÚLTIMA SYNC: {lastSync}</span>
         )}
      </header>

      <div className="flex-col" style={{ gap: '12px' }}>
         <p style={{ fontSize: '0.75rem', opacity: 0.7, lineHeight: '1.4' }}>
           Utilice esta herramienta para intercambiar datos entre puestos de trabajo aislados (Air-Gapped).
         </p>

         <div className="flex-row" style={{ gap: '12px' }}>
            <button 
              className="station-btn station-btn-primary" 
              style={{ flex: 1, height: '44px' }}
              onClick={handleExport}
              disabled={isExporting || isImporting}
            >
               <DownloadIcon size={16} />
               {isExporting ? 'EXPORTANDO...' : 'EXPORTAR'}
            </button>

            <label className="station-btn" style={{ flex: 1, height: '44px', cursor: 'pointer', position: 'relative' }}>
               <UploadIcon size={16} />
               {isImporting ? 'IMPORTANDO...' : 'IMPORTAR'}
               <input 
                type="file" 
                accept=".abdfn-sync,.json" 
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} 
                onChange={handleImport}
                disabled={isExporting || isImporting}
               />
            </label>
         </div>
      </div>

      {status && (
        <div className={`alert-box ${status.type === 'SUCCESS' ? 'success' : 'error'} animate-fade-in`} style={{ padding: '8px 12px', fontSize: '0.75rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
           {status.type === 'SUCCESS' ? <CheckCircleIcon size={14} /> : <AlertTriangleIcon size={14} />}
           <span>{status.msg}</span>
        </div>
      )}
    </div>
  );
};
