'use client';

import React from 'react';
import { Operator } from '@/lib/types/auth.types';
import { useLanguage } from '@/lib/context/LanguageContext';
import { SearchIcon, UserIcon, ShieldAlertIcon } from '@/components/common/Icons';

interface OperatorTableProps {
  operators: Operator[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  filter: string;
  onFilterChange: (val: string) => void;
}

export const OperatorTable: React.FC<OperatorTableProps> = ({
  operators,
  selectedId,
  onSelect,
  filter,
  onFilterChange
}) => {
  const { t } = useLanguage();

  const filtered = operators.filter(op => 
    op.name.toLowerCase().includes(filter.toLowerCase()) ||
    op.username.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="flex-col" style={{ height: '100%', gap: '16px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <div className="flex-row" style={{ gap: '12px', alignItems: 'center' }}>
            <SearchIcon size={18} style={{ opacity: 0.5 }} />
            <input 
              className="station-input" 
              placeholder={t('operator.search_placeholder')}
              value={filter}
              onChange={e => onFilterChange(e.target.value)}
              style={{ width: '250px' }}
            />
         </div>
         <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>{filtered.length} {t('operator.panel_title')}</span>
      </header>

      <div className="station-table-wrapper" style={{ flex: 1, overflow: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
        <table className="station-table">
          <thead>
            <tr>
              <th>{t('operator.username').toUpperCase()}</th>
              <th>{t('operator.display_name').toUpperCase()}</th>
              <th>{t('operator.role').toUpperCase()}</th>
              <th>{t('operator.status').toUpperCase()}</th>
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
                    {op.isMaster && <ShieldAlertIcon size={14} color="var(--accent-primary)" title={t('operator.master_badge')} />}
                    {op.username}
                  </div>
                </td>
                <td>{op.name}</td>
                <td style={{ fontSize: '0.75rem' }}>{t(`operator.roles.${op.role}`)}</td>
                <td>
                  <span className={`status-dot ${op.isActive ? 'active' : 'inactive'}`} />
                  <span style={{ opacity: 0.8, marginLeft: '8px' }}>
                    {op.isActive ? t('operator.active') : t('operator.inactive')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .status-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .status-dot.active { background: var(--status-ok); box-shadow: 0 0 8px var(--status-ok); }
        .status-dot.inactive { background: var(--status-err); opacity: 0.5; }
        .active { background: rgba(var(--accent-rgb), 0.1) !important; }
      `}</style>
    </div>
  );
};
