'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { coreDb } from '@/lib/db/SystemDB';
import { ComplianceReportService, AuditTrailFilter } from '@/lib/services/ComplianceReportService';
import { GlobalTelemetrySnapshot } from '@/lib/types/telemetry.types';
import { 
  XIcon, 
  DownloadIcon, 
  FileTextIcon, 
  DatabaseIcon, 
  ActivityIcon,
  CalendarIcon,
  FilterIcon,
  RefreshCwIcon
} from '@/components/common/Icons';

interface ReportExportModalProps {
  onClose: () => void;
  snapshot: GlobalTelemetrySnapshot | null;
}

type ReportType = 'MASTER_PDF' | 'MAPPING_HEALTH_CSV' | 'AUDIT_TRAIL_CSV';

export const ReportExportModal: React.FC<ReportExportModalProps> = ({ onClose, snapshot }) => {
  const { t } = useLanguage();
  const [reportType, setReportType] = useState<ReportType>('MASTER_PDF');
  const [isExporting, setIsExporting] = useState(false);
  
  // Filters for Audit Trail
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const units = useLiveQuery(() => coreDb.units.toArray(), []);

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    
    try {
        let blob: Blob;
        let filename: string;

        switch (reportType) {
            case 'MASTER_PDF':
                if (!snapshot) throw new Error('No telemetry snapshot available');
                blob = await ComplianceReportService.generateMasterPdf(snapshot);
                filename = `MASTER_REPORT_${new Date().toISOString().split('T')[0]}.pdf`;
                break;
            case 'MAPPING_HEALTH_CSV':
                blob = await ComplianceReportService.generateMappingHealthCsv();
                filename = `MAPPING_HEALTH_${new Date().toISOString().split('T')[0]}.csv`;
                break;
            case 'AUDIT_TRAIL_CSV':
                if (!selectedUnitId) { alert(t('supervisor.report_modal.error_no_unit')); setIsExporting(false); return; }
                const filter: AuditTrailFilter = { 
                    unitId: selectedUnitId,
                    startDate: startDate ? new Date(startDate).getTime() : undefined,
                    endDate: endDate ? new Date(endDate).getTime() : undefined
                };
                blob = await ComplianceReportService.generateDetailedAuditTrail(filter);
                filename = `AUDIT_TRAIL_${units?.find(u => u.id === selectedUnitId)?.code}_${new Date().toISOString().split('T')[0]}.csv`;
                break;
            default:
                throw new Error('Unknown report type');
        }

        ComplianceReportService.downloadBlob(blob, filename);
        setTimeout(onClose, 500);
    } catch (err) {
        console.error('[REPORT_EXPORT] Failed', err);
        alert(t('supervisor.report_modal.error_generic') + ': ' + (err as Error).message);
    } finally {
        setIsExporting(false);
    }
  };

  return (
    <div className="station-modal-overlay fade-in">
      <div className="station-modal" style={{ maxWidth: '640px' }}>
        <header className="station-modal-header">
          <div className="flex-row" style={{ gap: '12px', alignItems: 'center' }}>
             <DownloadIcon size={20} color="var(--primary-color)" />
             <h2 className="station-form-section-title" style={{ margin: 0 }}>{t('supervisor.report_modal.title').toUpperCase()}</h2>
          </div>
          <button className="station-btn secondary tiny" onClick={onClose}><XIcon size={16} /></button>
        </header>

        <main className="station-modal-content" style={{ padding: '24px', gap: '24px' }}>
           <div className="flex-col" style={{ gap: '24px' }}>
              
              {/* SELECTOR DE TIPO DE REPORTE */}
              <div className="flex-col" style={{ gap: '8px' }}>
                 <label className="station-registry-item-meta">{t('supervisor.report_modal.report_type')}</label>
                 <div className="flex-col" style={{ gap: '8px' }}>
                    <button 
                        className={`station-registry-sync-header clickable flex-row ${reportType === 'MASTER_PDF' ? 'active' : ''}`}
                        onClick={() => setReportType('MASTER_PDF')}
                        style={{ gap: '16px', padding: '16px', textAlign: 'left', border: reportType === 'MASTER_PDF' ? '1px solid var(--primary-color)' : '1px solid var(--border-color)', background: reportType === 'MASTER_PDF' ? 'rgba(var(--primary-color-rgb), 0.1)' : 'var(--surface-color)', color: 'var(--text-primary)' }}
                    >
                       <FileTextIcon size={18} color={reportType === 'MASTER_PDF' ? 'var(--primary-color)' : 'var(--text-secondary)'} />
                       <div className="flex-col" style={{ alignItems: 'flex-start' }}>
                          <span className="station-title-main" style={{ fontSize: '0.8rem' }}>{t('supervisor.report_modal.master_pdf')}</span>
                          <span className="station-registry-item-meta" style={{ fontSize: '0.65rem' }}>{t('supervisor.report_modal.master_pdf_desc')}</span>
                       </div>
                    </button>

                    <button 
                        className={`station-registry-sync-header clickable flex-row ${reportType === 'MAPPING_HEALTH_CSV' ? 'active' : ''}`}
                        onClick={() => setReportType('MAPPING_HEALTH_CSV')}
                        style={{ gap: '16px', padding: '16px', textAlign: 'left', border: reportType === 'MAPPING_HEALTH_CSV' ? '1px solid var(--primary-color)' : '1px solid var(--border-color)', background: reportType === 'MAPPING_HEALTH_CSV' ? 'rgba(var(--primary-color-rgb), 0.1)' : 'var(--surface-color)', color: 'var(--text-primary)' }}
                    >
                       <DatabaseIcon size={18} color={reportType === 'MAPPING_HEALTH_CSV' ? 'var(--primary-color)' : 'var(--text-secondary)'} />
                       <div className="flex-col" style={{ alignItems: 'flex-start' }}>
                          <span className="station-title-main" style={{ fontSize: '0.8rem' }}>{t('supervisor.report_modal.mapping_health')}</span>
                          <span className="station-registry-item-meta" style={{ fontSize: '0.65rem' }}>{t('supervisor.report_modal.mapping_health_desc')}</span>
                       </div>
                    </button>

                    <button 
                        className={`station-registry-sync-header clickable flex-row ${reportType === 'AUDIT_TRAIL_CSV' ? 'active' : ''}`}
                        onClick={() => setReportType('AUDIT_TRAIL_CSV')}
                        style={{ gap: '16px', padding: '16px', textAlign: 'left', border: reportType === 'AUDIT_TRAIL_CSV' ? '1px solid var(--primary-color)' : '1px solid var(--border-color)', background: reportType === 'AUDIT_TRAIL_CSV' ? 'rgba(var(--primary-color-rgb), 0.1)' : 'var(--surface-color)', color: 'var(--text-primary)' }}
                    >
                       <ActivityIcon size={18} color={reportType === 'AUDIT_TRAIL_CSV' ? 'var(--primary-color)' : 'var(--text-secondary)'} />
                       <div className="flex-col" style={{ alignItems: 'flex-start' }}>
                          <span className="station-title-main" style={{ fontSize: '0.8rem' }}>{t('supervisor.report_modal.audit_trail')}</span>
                          <span className="station-registry-item-meta" style={{ fontSize: '0.65rem' }}>{t('supervisor.report_modal.audit_trail_desc')}</span>
                       </div>
                    </button>
                 </div>
              </div>

              {/* FILTROS CONDICIONALES */}
              {reportType === 'AUDIT_TRAIL_CSV' && (
                 <div className="station-card fade-in" style={{ gap: '16px', padding: '20px', background: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
                    <div className="station-field-container">
                       <label className="station-registry-item-meta"><FilterIcon size={10} /> {t('supervisor.report_modal.select_unit')}</label>
                       <select 
                          className="station-input" 
                          value={selectedUnitId} 
                          onChange={(e) => setSelectedUnitId(e.target.value)}
                       >
                          <option value="">{t('supervisor.report_modal.select_unit_placeholder')}</option>
                          {units?.map(u => (
                             <option key={u.id} value={u.id}>[{u.code}] {u.name}</option>
                          ))}
                       </select>
                    </div>
                    <div className="station-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                       <div className="station-field-container">
                          <label className="station-registry-item-meta"><CalendarIcon size={10} /> {t('supervisor.report_modal.from')}</label>
                          <input type="date" className="station-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
                       </div>
                       <div className="station-field-container">
                          <label className="station-registry-item-meta"><CalendarIcon size={10} /> {t('supervisor.report_modal.to')}</label>
                          <input type="date" className="station-input" value={endDate} onChange={e => setEndDate(e.target.value)} />
                       </div>
                    </div>
                 </div>
              )}

              <div className="station-registry-sync-header" style={{ background: 'var(--surface-color)', border: '1px dashed var(--border-color)' }}>
                 <span className="station-shimmer-text" style={{ fontSize: '0.65rem' }}>
                    {t('supervisor.report_modal.hint')}
                 </span>
              </div>

           </div>
        </main>

        <footer className="station-modal-footer">
           <button className="station-btn secondary" onClick={onClose} disabled={isExporting}>{t('common.cancel')}</button>
           <button 
              className="station-btn station-btn-primary" 
              onClick={handleExport}
              disabled={isExporting || (reportType === 'AUDIT_TRAIL_CSV' && !selectedUnitId)}
              style={{ minWidth: '180px' }}
           >
              {isExporting ? <RefreshCwIcon size={16} className="spin" /> : <DownloadIcon size={16} />}
              <span>{isExporting ? t('supervisor.report_modal.btn_generating') : t('supervisor.report_modal.btn_generate')}</span>
           </button>
        </footer>
      </div>
    </div>
  );
};
