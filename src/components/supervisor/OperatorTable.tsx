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
      <header className="flex-row technical-header-small" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div className="flex-row" style={{ gap: '12px', alignItems: 'center' }}>
           <h3 style={{ margin: 0, fontSize: '0.7rem', letterSpacing: '2px', opacity: 0.4 }}>{t('operator.panel_title').toUpperCase()}</h3>
           <span className="station-badge-technical">{operators.length} NODES</span>
        </div>
        <button className="station-btn secondary tiny" onClick={() => onSelect(null)} style={{ padding: '4px' }}>
           <PlusIcon size={16} />
        </button>
      </header>

      <div className="flex-row search-row" style={{ marginBottom: '16px' }}>
        <div className="technical-input-container" style={{ flex: 1, position: 'relative' }}>
          <SearchIcon size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
          <input 
            className="station-input technical-input" 
            style={{ paddingLeft: '36px', height: '36px' }}
            placeholder={t('common.search').toUpperCase()}
            value={filter}
            onChange={e => onFilterChange(e.target.value)}
          />
        </div>
      </div>

      <div className="technical-table-container" style={{ flex: 1, overflow: 'auto', border: '1px solid #222', background: '#0a0a0a' }}>
        <table className="station-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#111', borderBottom: '1px solid #333' }}>
            <tr>
              <th style={{ textAlign: 'left', padding: '12px', fontSize: '0.6rem', opacity: 0.5 }}>{t('operator.username').toUpperCase()}</th>
              <th style={{ textAlign: 'left', padding: '12px', fontSize: '0.6rem', opacity: 0.5 }}>{t('operator.display_name').toUpperCase()}</th>
              <th style={{ textAlign: 'left', padding: '12px', fontSize: '0.6rem', opacity: 0.5 }}>{t('operator.role').toUpperCase()}</th>
              <th style={{ textAlign: 'left', padding: '12px', fontSize: '0.6rem', opacity: 0.5 }}>{t('audit.colTime').toUpperCase()} (LAST)</th>
              <th style={{ textAlign: 'left', padding: '12px', fontSize: '0.6rem', opacity: 0.5 }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(op => (
              <tr 
                key={op.id} 
                className={`node-row ${selectedId === op.id ? 'active' : ''}`}
                onClick={() => onSelect(op.id)}
                style={{ cursor: 'pointer' }}
              >
                <td style={{ borderBottom: '1px solid #1a1a1a', padding: '12px' }}>
                  <div className="flex-row" style={{ gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.75rem', fontWeight: 800 }}>{op.username}</span>
                    {op.isMaster && <ShieldCheckIcon size={12} color="var(--primary-color)" />}
                  </div>
                </td>
                <td style={{ borderBottom: '1px solid #1a1a1a', padding: '12px', fontSize: '0.8rem', opacity: 0.8 }}>{op.displayName}</td>
                <td style={{ borderBottom: '1px solid #1a1a1a', padding: '12px' }}>
                  <span className={`badge-technical ${op.role.toLowerCase()}`}>
                    {t(`operator.roles.${op.role}`).toUpperCase()}
                  </span>
                </td>
                <td style={{ borderBottom: '1px solid #1a1a1a', padding: '12px', fontSize: '0.65rem', opacity: 0.4, fontFamily: 'Space Mono' }}>
                  {op.lastLogin ? new Date(op.lastLogin).toLocaleString() : 'NEVER'}
                </td>
                <td style={{ borderBottom: '1px solid #1a1a1a', padding: '12px' }}>
                  <div className={`status-indicator ${op.isActive === 1 ? 'active' : 'inactive'}`}>
                     {op.isActive === 1 ? 'ONLINE' : 'DEACTIVATED'}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .node-row:hover { background: rgba(255, 255, 255, 0.02); }
        .node-row.active { background: rgba(56, 189, 248, 0.05); }
        .station-badge-technical {
           background: #1a1a1a;
           border: 1px solid #333;
           padding: 2px 8px;
           border-radius: 2px;
           font-size: 0.6rem;
           font-weight: 900;
           letter-spacing: 1px;
        }
        .badge-technical {
           font-size: 0.6rem;
           font-weight: 900;
           padding: 2px 6px;
           border-radius: 2px;
           border: 1px solid #333;
        }
        .badge-technical.admin { border-color: #f43f5e; color: #f43f5e; }
        .badge-technical.supervisor { border-color: #38bdf8; color: #38bdf8; }
        .status-indicator {
           font-size: 0.6rem;
           font-weight: 800;
           display: flex;
           align-items: center;
           gap: 6px;
        }
        .status-indicator::before {
           content: "";
           width: 6px;
           height: 6px;
           border-radius: 50%;
        }
        .status-indicator.active { color: #10b981; }
        .status-indicator.active::before { background: #10b981; }
        .status-indicator.inactive { color: #ef4444; opacity: 0.5; }
        .status-indicator.inactive::before { background: #ef4444; }
        .technical-input {
           background: var(--bg-color) !important;
           border: 1px solid var(--border-color) !important;
           color: var(--text-primary) !important;
           font-family: var(--font-mono);
           font-size: 0.7rem;
           letter-spacing: 1px;
           transition: var(--snap);
        }
        .technical-input:focus {
           border-color: var(--primary-color) !important;
           outline: none;
           background: var(--surface-color) !important;
        }
      `}</style>
    </div>
  );
};
