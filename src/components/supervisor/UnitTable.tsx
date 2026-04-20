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
      <table className="station-table">
        <thead>
          <tr>
            <th style={{ width: '60px' }}>{t('supervisor.unit_status')}</th>
            <th>{t('supervisor.unit_name')}</th>
            <th>{t('supervisor.unit_activity')}</th>
            <th>{t('supervisor.unit_qa')}</th>
            <th>{t('supervisor.unit_security')}</th>
            <th>{t('supervisor.unit_storage')}</th>
          </tr>
        </thead>
        <tbody>
          {units.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
                 NO DATA AVAILABLE FROM UNITS
              </td>
            </tr>
          ) : (
            units.map(u => (
              <tr key={u.unitId} className="unit-row">
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    {getStatusIcon(u.health)}
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{u.unitCode}</span>
                    <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>{u.unitName}</span>
                  </div>
                </td>
                <td>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.8rem' }}>
                    {formatActivityDate(u.lastActivityAt)}
                  </span>
                </td>
                <td>
                  <div className="qa-stat-pill">
                    <span className="match">{u.qa.mappingsWithGolden} MATCH</span>
                    <span className="divider">|</span>
                    <span className={`break ${u.qa.recentBreaks > 0 ? 'alert' : ''}`}>{u.qa.recentBreaks} BREAK</span>
                  </div>
                </td>
                <td>
                   <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <div className={`sec-pill ${u.security.severity}`}>
                        {u.security.failedLogins} FAIL
                      </div>
                      {u.security.locksTriggered > 0 && (
                        <div className="sec-pill CRITICAL">! LOCK</div>
                      )}
                   </div>
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', width: '100px' }}>
                    <div className="storage-bg">
                      <div className="storage-bar" style={{ width: `${u.storage.usagePercent || 0}%` }}></div>
                    </div>
                    <span style={{ fontSize: '0.6rem', opacity: 0.5, marginTop: '4px' }}>
                      {Math.round(u.storage.usagePercent || 0)}% USED
                    </span>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <style jsx>{`
        .station-table {
          width: 100%;
          border-collapse: collapse;
        }
        .station-table th {
          background: rgba(255,255,255,0.05);
          text-align: left;
          padding: 12px 16px;
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.05rem;
          color: var(--text-secondary);
        }
        .unit-row td {
          padding: 16px;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          vertical-align: middle;
        }
        .unit-row:hover {
          background: rgba(var(--primary-rgb), 0.03);
        }
        .qa-stat-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(0,0,0,0.2);
          padding: 4px 8px;
          border-radius: 4px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.7rem;
        }
        .qa-stat-pill .match { color: var(--status-ok); }
        .qa-stat-pill .divider { opacity: 0.2; }
        .qa-stat-pill .break { opacity: 0.4; }
        .qa-stat-pill .break.alert { color: var(--status-critical); opacity: 1; font-weight: bold; }
        
        .sec-pill {
           padding: 2px 6px;
           border-radius: 3px;
           font-size: 0.65rem;
           font-weight: bold;
           background: rgba(255,255,255,0.05);
        }
        .sec-pill.WARN { background: rgba(255, 165, 0, 0.2); color: orange; }
        .sec-pill.CRITICAL { background: rgba(255, 0, 0, 0.2); color: var(--status-critical); }
        
        .storage-bg {
          height: 6px;
          background: rgba(255,255,255,0.05);
          border-radius: 3px;
          overflow: hidden;
        }
        .storage-bar {
          height: 100%;
          background: var(--primary-color);
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
};
