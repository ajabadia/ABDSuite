'use client';

import React from 'react';
import { Operator } from '@/lib/types/auth.types';
import { useLanguage } from '@/lib/context/LanguageContext';
import { SearchIcon, PlusIcon, ShieldCheckIcon, DownloadIcon } from '@/components/common/Icons';

interface OperatorTableProps {
  operators: Operator[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  filter: string;
  onFilterChange: (val: string) => void;
  onExport: () => void;
}

export const OperatorTable: React.FC<OperatorTableProps> = ({
  operators,
  selectedId,
  onSelect,
  filter,
  onFilterChange,
  onExport
}) => {
  const { t } = useLanguage();

  const filtered = operators.filter(op => {
    const search = filter.toLowerCase();
    const uname = (op?.username || '').toLowerCase();
    const dname = (op?.displayName || '').toLowerCase();
    return uname.includes(search) || dname.includes(search);
  });

  return (
    <div className="flex-col" style={{ height: '100%' }}>
      <header className="station-panel-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
        <div className="flex-row" style={{ gap: '12px', alignItems: 'center' }}>
           <h3 className="station-form-section-title" style={{ margin: 0 }}>{t('operator.panel_title').toUpperCase()}</h3>
           <span className="station-badge station-badge-blue">{operators.length} NODES</span>
        </div>
        <div className="flex-row" style={{ gap: '8px' }}>
           <button className="station-btn secondary tiny" onClick={onExport} title={t('common.export')}>
              <DownloadIcon size={16} />
           </button>
           <button className="station-btn secondary tiny" onClick={() => onSelect(null)}>
              <PlusIcon size={16} />
           </button>
        </div>
      </header>

      <div className="flex-col" style={{ padding: '16px', gap: '16px', flex: 1, overflow: 'hidden' }}>
        <div className="station-field-container" style={{ margin: 0 }}>
          <div className="flex-row" style={{ position: 'relative', alignItems: 'center' }}>
            <SearchIcon size={14} style={{ position: 'absolute', left: '12px', opacity: 0.4 }} />
            <input 
              className="station-input" 
              style={{ paddingLeft: '36px', width: '100%' }}
              placeholder={t('common.search').toUpperCase()}
              value={filter}
              onChange={e => onFilterChange(e.target.value)}
            />
          </div>
        </div>

        <div className="station-registry-scroller" style={{ flex: 1, border: '1px solid var(--border-color)', borderRadius: '2px' }}>
          <table className="station-table">
            <thead>
              <tr>
                <th>{t('operator.username').toUpperCase()}</th>
                <th>{t('operator.display_name').toUpperCase()}</th>
                <th>{t('operator.role').toUpperCase()}</th>
                <th>{t('audit.colTime').toUpperCase()}</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(op => (
                <tr 
                  key={op.id} 
                  className={selectedId === op.id ? 'active' : ''}
                  onClick={() => onSelect(op.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <div className="flex-row" style={{ gap: '8px', alignItems: 'center' }}>
                      <span className="station-title-main" style={{ fontSize: '0.75rem' }}>{op.username}</span>
                      {op.isMaster && <ShieldCheckIcon size={12} color="var(--primary-color)" />}
                    </div>
                  </td>
                  <td className="station-registry-item-meta">{op.displayName}</td>
                  <td>
                    <span className="station-badge">
                      {t(`operator.roles.${op.role}`).toUpperCase()}
                    </span>
                  </td>
                  <td className="station-registry-item-meta" style={{ fontSize: '0.65rem' }}>
                    {op.lastLogin ? new Date(op.lastLogin).toLocaleString() : 'NEVER'}
                  </td>
                  <td>
                    <div className={`flex-row`} style={{ gap: '6px', alignItems: 'center' }}>
                       <div className="integrity-dot" style={{ background: op.isActive === 1 ? 'var(--status-ok)' : 'var(--status-err)' }} />
                       <span style={{ fontSize: '0.6rem', fontWeight: 800, color: op.isActive === 1 ? 'var(--status-ok)' : 'var(--status-err)' }}>
                          {op.isActive === 1 ? 'ONLINE' : 'LOCKED'}
                       </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
