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
                if (!selectedUnitId) { alert('Seleccione una unidad'); setIsExporting(false); return; }
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
        alert('Error al generar el reporte: ' + (err as Error).message);
    } finally {
        setIsExporting(false);
    }
  };

  return (
    <div className="station-modal-overlay">
      <div className="station-modal" style={{ maxWidth: '600px' }}>
        <header className="station-modal-header">
          <div className="flex-row" style={{ gap: '12px', alignItems: 'center' }}>
             <DownloadIcon size={20} color="var(--primary-color)" />
             <h2 style={{ fontSize: '0.85rem', fontWeight: 900, letterSpacing: '2px', margin: 0 }}>REPORT_EXPORT_CENTER</h2>
          </div>
          <button className="station-btn secondary tiny" onClick={onClose}><XIcon size={16} /></button>
        </header>

        <main className="station-modal-content">
           <div className="flex-col" style={{ gap: '24px' }}>
              
              {/* SELECTOR DE TIPO DE REPORTE */}
              <div className="flex-col" style={{ gap: '8px' }}>
                 <label className="station-label">TIPO_DE_INFORME</label>
                 <div className="grid-report-types" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                    <button 
                       className={`report-type-btn ${reportType === 'MASTER_PDF' ? 'active' : ''}`}
                       onClick={() => setReportType('MASTER_PDF')}
                    >
                       <FileTextIcon size={18} />
                       <div className="flex-col" style={{ alignItems: 'flex-start' }}>
                          <span className="title">MASTER COMPLIANCE PDF</span>
                          <span className="desc">KPIs globales, seguridad y resumen de planta (High-Fidelity)</span>
                       </div>
                    </button>
                    <button 
                       className={`report-type-btn ${reportType === 'MAPPING_HEALTH_CSV' ? 'active' : ''}`}
                       onClick={() => setReportType('MAPPING_HEALTH_CSV')}
                    >
                       <DatabaseIcon size={18} />
                       <div className="flex-col" style={{ alignItems: 'flex-start' }}>
                          <span className="title">MAPPING HEALTH AUDIT (CSV)</span>
                          <span className="desc">Estado de cobertura detallado de todas las unidades activas</span>
                       </div>
                    </button>
                    <button 
                       className={`report-type-btn ${reportType === 'AUDIT_TRAIL_CSV' ? 'active' : ''}`}
                       onClick={() => setReportType('AUDIT_TRAIL_CSV')}
                    >
                       <ActivityIcon size={18} />
                       <div className="flex-col" style={{ alignItems: 'flex-start' }}>
                          <span className="title">DETAILED AUDIT TRAIL (CSV)</span>
                          <span className="desc">Volcado crudo de eventos de auditoría forense por unidad</span>
                       </div>
                    </button>
                 </div>
              </div>

              {/* FILTROS CONDICIONALES */}
              {reportType === 'AUDIT_TRAIL_CSV' && (
                 <div className="flex-col fade-in" style={{ gap: '16px', padding: '16px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'rgba(0,0,0,0.1)' }}>
                    <div className="flex-col" style={{ gap: '4px' }}>
                       <label className="station-label"><FilterIcon size={10} /> SELECCIONAR_UNIDAD</label>
                       <select 
                          className="station-select" 
                          value={selectedUnitId} 
                          onChange={(e) => setSelectedUnitId(e.target.value)}
                       >
                          <option value="">-- SELECCIONE UNIDAD --</option>
                          {units?.map(u => (
                             <option key={u.id} value={u.id}>[{u.code}] {u.name}</option>
                          ))}
                       </select>
                    </div>
                    <div className="flex-row" style={{ gap: '12px' }}>
                       <div className="flex-col" style={{ flex: 1, gap: '4px' }}>
                          <label className="station-label"><CalendarIcon size={10} /> DESDE</label>
                          <input type="date" className="station-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
                       </div>
                       <div className="flex-col" style={{ flex: 1, gap: '4px' }}>
                          <label className="station-label"><CalendarIcon size={10} /> HASTA</label>
                          <input type="date" className="station-input" value={endDate} onChange={e => setEndDate(e.target.value)} />
                       </div>
                    </div>
                 </div>
              )}

              <div style={{ marginTop: '8px', padding: '12px', border: '1px solid rgba(var(--primary-color-rgb), 0.2)', borderRadius: '4px', background: 'rgba(var(--primary-color-rgb), 0.05)' }}>
                 <p style={{ fontSize: '0.65rem', margin: 0, opacity: 0.6, lineHeight: 1.4 }}>
                    * Los reportes CSV utilizan ';' como delimitador industrial. Los informes PDF incluyen firmas de integridad para validación offline.
                 </p>
              </div>

           </div>
        </main>

        <footer className="station-modal-footer">
           <button className="station-btn secondary" onClick={onClose} disabled={isExporting}>CANCELAR</button>
           <button 
              className="station-btn station-btn-primary" 
              onClick={handleExport}
              disabled={isExporting || (reportType === 'AUDIT_TRAIL_CSV' && !selectedUnitId)}
              style={{ minWidth: '160px' }}
           >
              {isExporting ? <><RefreshCwIcon size={16} className="spin" /> GENERANDO...</> : <><DownloadIcon size={16} /> GENERAR_INFORME</>}
           </button>
        </footer>
      </div>

      <style jsx>{`
         .report-type-btn {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 16px;
            background: rgba(255,255,255,0.02);
            border: 1px solid var(--border-color);
            border-radius: 4px;
            color: var(--text-primary);
            text-align: left;
            cursor: pointer;
            transition: all var(--snap);
         }
         .report-type-btn:hover {
            background: rgba(255,255,255,0.05);
            border-color: rgba(var(--primary-color-rgb), 0.5);
         }
         .report-type-btn.active {
            background: rgba(var(--primary-color-rgb), 0.1);
            border-color: var(--primary-color);
            box-shadow: inset 4px 0 0 var(--primary-color);
         }
         .report-type-btn .title { font-weight: 900; font-size: 0.8rem; letter-spacing: 1px; }
         .report-type-btn .desc { font-size: 0.65rem; opacity: 0.4; margin-top: 2px; }
         .report-type-btn.active .desc { opacity: 0.7; color: var(--primary-color); }
      `}</style>
    </div>
  );
};
