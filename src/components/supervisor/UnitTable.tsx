'use client';

import React from 'react';
import { UnitTelemetrySnapshot } from '@/lib/types/telemetry.types';
import { useLanguage } from '@/lib/context/LanguageContext';
import { 
  CheckCircleIcon, 
  AlertTriangleIcon, 
  ShieldAlertIcon
} from '@/components/common/Icons';

interface UnitTableProps {
  units: UnitTelemetrySnapshot[];
}

export const UnitTable: React.FC<UnitTableProps> = ({ units }) => {
  const { t } = useLanguage();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OK': return <CheckCircleIcon size={16} color="var(--status-ok)" />;
      case 'WARN': return <AlertTriangleIcon size={16} color="var(--status-warn)" />;
      case 'CRITICAL': return <ShieldAlertIcon size={16} color="var(--status-err)" />;
      default: return null;
    }
  };

  const formatActivityDate = (ts: number | null) => {
    if (!ts) return '---';
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="flex-col" style={{ width: '100%' }}>
      <table className="station-table">
        <thead>
          <tr>
            <th style={{ width: '60px', textAlign: 'center' }}>{t('supervisor.unit_status')}</th>
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
              <td colSpan={6}>
                 <div className="station-empty-state" style={{ height: '100px' }}>
                    <span className="station-shimmer-text">NO DATA AVAILABLE FROM UNITS</span>
                 </div>
              </td>
            </tr>
          ) : (
            units.map(u => (
              <tr key={u.unitId} className="fade-in">
                <td style={{ textAlign: 'center' }}>
                  <div className="flex-row" style={{ justifyContent: 'center' }}>
                    {getStatusIcon(u.health)}
                  </div>
                </td>
                <td>
                  <div className="flex-col">
                    <span className="station-title-main" style={{ fontSize: '0.8rem' }}>{u.unitCode}</span>
                    <span className="station-registry-item-meta" style={{ fontSize: '0.6rem' }}>{u.unitName}</span>
                  </div>
                </td>
                <td className="station-registry-item-meta" style={{ fontSize: '0.75rem' }}>
                  {formatActivityDate(u.lastActivityAt)}
                </td>
                <td>
                  <div className="flex-row" style={{ gap: '8px', fontSize: '0.65rem', fontWeight: 800 }}>
                    <span style={{ color: 'var(--status-ok)' }}>{u.qa.mappingsWithGolden} OK</span>
                    <span style={{ color: u.qa.recentBreaks > 0 ? 'var(--status-err)' : 'inherit', opacity: u.qa.recentBreaks > 0 ? 1 : 0.3 }}>
                      [{u.qa.recentBreaks} ERR]
                    </span>
                  </div>
                </td>
                <td>
                   <div className="flex-row" style={{ gap: '6px', alignItems: 'center' }}>
                      <span className={`station-badge tiny ${u.security.severity === 'CRITICAL' ? 'station-badge-orange' : u.security.severity === 'WARN' ? 'station-badge-orange' : 'secondary'}`}>
                        {u.security.failedLogins} F
                      </span>
                      {u.security.locksTriggered > 0 && (
                        <span className="station-badge tiny station-badge-orange station-shimmer-text">! LOCK</span>
                      )}
                   </div>
                </td>
                <td>
                  <div className="flex-col" style={{ width: '80px', gap: '4px' }}>
                    <div className="station-progress-bar" style={{ height: '4px' }}>
                      <div className="station-progress-fill" style={{ width: `${u.storage.usagePercent || 0}%`, background: (u.storage.usagePercent || 0) > 90 ? 'var(--status-err)' : 'var(--primary-color)' }}></div>
                    </div>
                    <span className="station-registry-item-meta" style={{ fontSize: '0.55rem' }}>
                      {Math.round(u.storage.usagePercent || 0)}% USAGE
                    </span>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
