import React, { useState } from 'react';
import { ShieldIcon, ChevronRightIcon, ArrowUpIcon, ArrowDownIcon } from '../common/Icons';

interface ConfigDiffCardProps {
  before: any;
  after: any;
  title?: string;
  category?: string;
  ignoreKeys?: string[];
  pageSize?: number;
}

/**
 * ConfigDiffCard (Phase 18 Industrial)
 * Advanced visual configuration forensics for industrial audits.
 */
export const ConfigDiffCard: React.FC<ConfigDiffCardProps> = ({ 
  before, 
  after, 
  title, 
  category, 
  ignoreKeys = [], 
  pageSize = 10 
}) => {
  const [currentPage, setCurrentPage] = useState(0);

  const rawKeys = Array.from(new Set([...Object.keys(before || {}), ...Object.keys(after || {})]));
  const filteredKeys = rawKeys
    .filter(key => {
      if (ignoreKeys.includes(key)) return false;
      return JSON.stringify(before?.[key]) !== JSON.stringify(after?.[key]);
    })
    .sort();

  const totalPages = Math.ceil(filteredKeys.length / pageSize);
  const startIdx = currentPage * pageSize;
  const visibleKeys = filteredKeys.slice(startIdx, startIdx + pageSize);

  const renderValue = (val: any) => {
    if (val === null) return 'null';
    if (val === undefined) return 'undefined';
    if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  };

  const getTrend = (prev: any, next: any) => {
    if (typeof prev === 'number' && typeof next === 'number') {
      if (next > prev) return <ArrowUpIcon size={12} color="var(--status-ok)" />;
      if (next < prev) return <ArrowDownIcon size={12} color="var(--error-color)" />;
    }
    if (typeof prev === 'boolean' && typeof next === 'boolean') {
      if (prev === false && next === true) return <ArrowUpIcon size={12} color="var(--status-ok)" />;
      if (prev === true && next === false) return <ArrowDownIcon size={12} color="var(--error-color)" />;
    }
    return null;
  };

  return (
    <div className="config-diff-card flex-col animate-fade-in" style={{ 
      background: 'rgba(0,0,0,0.1)', 
      border: '1px solid var(--border-color)', 
      borderRadius: '4px',
      overflow: 'hidden'
    }}>
      <div className="diff-header" style={{ 
        padding: '12px 16px', 
        background: 'rgba(255,255,255,0.03)', 
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <ShieldIcon size={16} color="var(--primary-color)" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 900, opacity: 0.5, letterSpacing: '2px' }}>
            {category || 'CONFIGURATION_CHANGE'}
          </div>
          {title && <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '2px' }}>{title}</div>}
        </div>
      </div>

      <div className="diff-body" style={{ minHeight: '60px' }}>
        {visibleKeys.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', opacity: 0.4, fontSize: '0.75rem' }}>
            NO_RELEVANT_CHANGES_DETECTED
          </div>
        ) : (
          visibleKeys.map(key => {
            const valBefore = before?.[key];
            const valAfter = after?.[key];
            const isAdded = valBefore === undefined;
            const isRemoved = valAfter === undefined;
            const trend = getTrend(valBefore, valAfter);

            return (
              <div key={key} className="diff-row" style={{ 
                display: 'flex', 
                flexDirection: 'column',
                padding: '12px 16px', 
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                background: isAdded ? 'rgba(52, 211, 153, 0.03)' : (isRemoved ? 'rgba(248, 113, 113, 0.03)' : 'transparent')
              }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--primary-color)', marginBottom: '6px', opacity: 0.7 }}>
                  {key.toUpperCase()}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem' }}>
                  <div style={{ 
                    flex: 1, 
                    textDecoration: isRemoved ? 'line-through' : 'none', 
                    opacity: 0.4,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {renderValue(valBefore)}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ChevronRightIcon size={12} style={{ opacity: 0.2 }} />
                    {trend}
                  </div>

                  <div style={{ 
                    flex: 1, 
                    fontWeight: 700, 
                    color: isAdded ? 'var(--status-ok)' : (isRemoved ? 'var(--error-color)' : 'var(--text-primary)'),
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {renderValue(valAfter)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {totalPages > 1 && (
        <div className="diff-footer" style={{ 
          padding: '8px 16px', 
          background: 'rgba(0,0,0,0.2)', 
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.7rem'
        }}>
          <div style={{ opacity: 0.5, fontWeight: 700 }}>
            {startIdx + 1}–{Math.min(startIdx + pageSize, filteredKeys.length)} OF {filteredKeys.length} · {currentPage + 1}/{totalPages}
          </div>
          <div className="flex-row" style={{ gap: '8px' }}>
            <button 
              className="station-btn icon-only tiny secondary" 
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              ‹
            </button>
            <button 
              className="station-btn icon-only tiny secondary" 
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
