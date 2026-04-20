'use client';

import React from 'react';
import { Operator, UserRole } from '@/lib/types/auth.types';
import { useLanguage } from '@/lib/context/LanguageContext';
import { SearchIcon, PlusIcon, ShieldCheckIcon } from '@/components/common/Icons';

interface OperatorTableProps {
  operators: Operator[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
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

  const filtered = operators.filter(op => {
    const search = filter.toLowerCase();
    const uname = (op?.username || '').toLowerCase();
    const dname = (op?.displayName || '').toLowerCase();
    return uname.includes(search) || dname.includes(search);
  });

  return (
    <div className="flex-col" style={{ height: '100%', gap: '16px' }}>
      <header className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="flex-row" style={{ gap: '12px', alignItems: 'center' }}>
           <h3 style={{ margin: 0 }}>{t('operator.panel_title').toUpperCase()}</h3>
           <span className="station-badge info">{operators.length} TOTAL</span>
        </div>
        <button className="station-btn secondary icon-only" onClick={() => onSelect(null)}>
           <PlusIcon size={18} />
        </button>
      </header>

      <div className="flex-row" style={{ gap: '12px' }}>
        <div className="station-input-wrapper" style={{ flex: 1 }}>
          <SearchIcon size={16} className="input-icon" />
          <input 
            className="station-input" 
            style={{ paddingLeft: '32px' }}
            placeholder={t('common.search')}
            value={filter}
            onChange={e => onFilterChange(e.target.value)}
          />
        </div>
      </div>

      <div className="station-table-wrapper" style={{ flex: 1, overflow: 'auto' }}>
        <table className="station-table">
          <thead>
            <tr>
              <th>{t('operator.username').toUpperCase()}</th>
              <th>{t('operator.display_name').toUpperCase()}</th>
              <th>{t('operator.role').toUpperCase()}</th>
              <th>{t('audit.colTime').toUpperCase()} (LAST)</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(op => (
              <tr 
                key={op.id} 
                className={selectedId === op.id ? 'selected' : ''}
                onClick={() => onSelect(op.id)}
                style={{ cursor: 'pointer' }}
              >
                <td>
                  <div className="flex-row" style={{ gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{op.username}</span>
                    {op.isMaster && <ShieldCheckIcon size={12} color="var(--accent-primary)" />}
                  </div>
                </td>
                <td>{op.displayName}</td>
                <td>
                  <span className={`station-badge ${op.role.toLowerCase()}`}>
                    {t(`operator.roles.${op.role}`)}
                  </span>
                </td>
                <td style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                  {op.lastLogin ? new Date(op.lastLogin).toLocaleString() : 'NEVER'}
                </td>
                <td>
                  <span className={`status-pill ${op.isActive === 1 ? 'active' : 'inactive'}`}>
                    {op.isActive === 1 ? t('operator.active') : t('operator.inactive')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
