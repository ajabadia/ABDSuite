'use client';

import React from 'react';
import { UnitTelemetrySnapshot } from '@/lib/types/telemetry.types';
import { useLanguage } from '@/lib/context/LanguageContext';
import { 
  CheckCircleIcon, 
  AlertTriangleIcon, 
  ShieldAlertIcon,
  ActivityIcon
} from '@/components/common/Icons';

interface UnitTableProps {
  units: UnitTelemetrySnapshot[];
}

export const UnitTable: React.FC<UnitTableProps> = ({ units }) => {
  const { t } = useLanguage();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OK': return <CheckCircleIcon size={16} style={{ color: 'var(--status-ok)' }} />;
      case 'WARN': return <AlertTriangleIcon size={16} style={{ color: 'var(--status-warning)' }} />;
      case 'CRITICAL': return <ShieldAlertIcon size={16} style={{ color: 'var(--status-critical)' }} />;
      default: return null;
    }
  };

  const formatActivityDate = (ts: number | null) => {
    if (!ts) return '---';
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div style={{ width: '100%' }}>
      <table className="station-table" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead style={{ background: '#0a0a0a' }}>
          <tr>
            <th style={{ width: '60px', padding: '12px', borderBottom: '1px solid #222' }}>{t('supervisor.unit_status')}</th>
            <th style={{ borderBottom: '1px solid #222' }}>{t('supervisor.unit_name')}</th>
            <th style={{ borderBottom: '1px solid #222' }}>{t('supervisor.unit_activity')}</th>
            <th style={{ borderBottom: '1px solid #222' }}>{t('supervisor.unit_qa')}</th>
            <th style={{ borderBottom: '1px solid #222' }}>{t('supervisor.unit_security')}</th>
            <th style={{ borderBottom: '1px solid #222' }}>{t('supervisor.unit_storage')}</th>
          </tr>
        </thead>
        <tbody>
          {units.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '40px', opacity: 0.3, fontSize: '0.7rem', letterSpacing: '2px' }}>
                 NO DATA AVAILABLE FROM UNITS
              </td>
            </tr>
          ) : (
            units.map(u => (
              <tr key={u.unitId} className="unit-row">
                <td style={{ textAlign: 'center', borderBottom: '1px solid #1a1a1a' }}>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    {getStatusIcon(u.health)}
                  </div>
                </td>
                <td style={{ borderBottom: '1px solid #1a1a1a' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.5px' }}>{u.unitCode}</span>
                    <span style={{ fontSize: '0.6rem', opacity: 0.4, textTransform: 'uppercase' }}>{u.unitName}</span>
                  </div>
                </td>
                <td style={{ borderBottom: '1px solid #1a1a1a' }}>
                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.75rem', opacity: 0.8 }}>
                    {formatActivityDate(u.lastActivityAt)}
                  </span>
                </td>
                <td style={{ borderBottom: '1px solid #1a1a1a' }}>
                  <div className="qa-pill-technical">
                    <span className="match">{u.qa.mappingsWithGolden} OK</span>
                    <span className={`break ${u.qa.recentBreaks > 0 ? 'alert' : ''}`}>[{u.qa.recentBreaks} ERR]</span>
                  </div>
                </td>
                <td style={{ borderBottom: '1px solid #1a1a1a' }}>
                   <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <div className={`sec-badge-technical ${u.security.severity}`}>
                        {u.security.failedLogins} F
                      </div>
                      {u.security.locksTriggered > 0 && (
                        <div className="sec-badge-technical CRITICAL">! LOCK</div>
                      )}
                   </div>
                </td>
                <td style={{ borderBottom: '1px solid #1a1a1a' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', width: '80px' }}>
                    <div className="storage-track">
                      <div className="storage-meter" style={{ width: `${u.storage.usagePercent || 0}%` }}></div>
                    </div>
                    <span style={{ fontSize: '0.55rem', opacity: 0.4, marginTop: '4px', fontWeight: 800 }}>
                      {Math.round(u.storage.usagePercent || 0)}% USAGE
                    </span>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <style jsx>{`
        .unit-row td {
          padding: 12px 16px;
          vertical-align: middle;
        }
        .unit-row:hover {
          background: rgba(255, 255, 255, 0.02);
        }
        .qa-pill-technical {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #000;
          padding: 4px 10px;
          border: 1px solid #222;
          border-radius: 2px;
          font-family: 'Space Mono', monospace;
          font-size: 0.65rem;
          font-weight: 800;
        }
        .qa-pill-technical .match { color: #10b981; }
        .qa-pill-technical .break { opacity: 0.3; }
        .qa-pill-technical .break.alert { color: #ef4444; opacity: 1; }
        
        .sec-badge-technical {
           padding: 2px 6px;
           border: 1px solid #333;
           border-radius: 2px;
           font-size: 0.6rem;
           font-weight: 900;
           background: #111;
           font-family: 'Space Mono', monospace;
        }
        .sec-badge-technical.WARN { border-color: #f59e0b; color: #f59e0b; }
        .sec-badge-technical.CRITICAL { border-color: #ef4444; color: #ef4444; background: rgba(239, 68, 68, 0.1); }
        
        .storage-track {
          height: 4px;
          background: #222;
          border-radius: 0;
          overflow: hidden;
        }
        .storage-meter {
          height: 100%;
          background: var(--primary-color);
          border-radius: 0;
        }
      `}</style>
    </div>
  );
};
