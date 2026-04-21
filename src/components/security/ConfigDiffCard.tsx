'use client';

import React from 'react';
import { ShieldIcon, ChevronRightIcon } from '../common/Icons';

interface ConfigDiffCardProps {
  before: any;
  after: any;
  title?: string;
  category?: string;
}

/**
 * ConfigDiffCard (Phase 18)
 * Industrial component for visual configuration forensics.
 * Highlights deleted, added and modified keys in JSON objects.
 */
export const ConfigDiffCard: React.FC<ConfigDiffCardProps> = ({ before, after, title, category }) => {
  const allKeys = Array.from(new Set([...Object.keys(before || {}), ...Object.keys(after || {})])).sort();

  const renderValue = (val: any) => {
    if (val === null) return 'null';
    if (val === undefined) return 'undefined';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  };

  return (
    <div className="config-diff-card station-card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
      <div style={{ 
        padding: '12px 16px', 
        background: 'rgba(255,255,255,0.03)', 
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <ShieldIcon size={16} color="var(--primary-color)" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.5, letterSpacing: '1px' }}>
            {category || 'CONFIGURATION_CHANGE'}
          </div>
          {title && <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{title}</div>}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {allKeys.map(key => {
          const valBefore = before?.[key];
          const valAfter = after?.[key];
          const isChanged = JSON.stringify(valBefore) !== JSON.stringify(valAfter);
          const isAdded = valBefore === undefined;
          const isRemoved = valAfter === undefined;

          if (!isChanged) return null;

          return (
            <div key={key} style={{ 
              display: 'flex', 
              padding: '12px 16px', 
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              background: isAdded ? 'rgba(var(--status-ok-rgb), 0.05)' : (isRemoved ? 'rgba(var(--error-color-rgb), 0.05)' : 'transparent'),
              alignItems: 'center',
              fontSize: '0.8rem'
            }}>
              <div style={{ width: '150px', fontWeight: 800, opacity: 0.7, fontFamily: 'monospace' }}>
                {key}
              </div>
              
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                <div style={{ 
                  flex: 1, 
                  textDecoration: isRemoved ? 'line-through' : 'none', 
                  opacity: 0.5,
                  fontFamily: 'monospace',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {renderValue(valBefore)}
                </div>
                
                <ChevronRightIcon size={14} style={{ opacity: 0.3 }} />
                
                <div style={{ 
                  flex: 1, 
                  fontWeight: 700, 
                  color: isAdded ? 'var(--status-ok)' : (isRemoved ? 'var(--error-color)' : 'var(--primary-color)'),
                  fontFamily: 'monospace',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {renderValue(valAfter)}
                </div>
              </div>
            </div>
          );
        })}
        
        {allKeys.filter(k => JSON.stringify(before?.[k]) !== JSON.stringify(after?.[k])).length === 0 && (
          <div style={{ padding: '24px', textAlign: 'center', opacity: 0.4, fontSize: '0.8rem' }}>
            NO_DIFFERENTIAL_CHANGES_DETECTED
          </div>
        )}
      </div>
    </div>
  );
};
