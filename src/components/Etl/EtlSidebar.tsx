'use client';

import React from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { EtlPreset } from '@/lib/types/etl.types';
import { ListIcon, DownloadIcon, TrashIcon } from '@/components/common/Icons';

interface EtlSidebarProps {
  presets: EtlPreset[];
  activePresetId?: number;
  onSelect: (preset: EtlPreset) => void;
  onDelete: (id: number) => void;
  onExport: (preset: EtlPreset) => void;
  onNew: () => void;
  onImport: () => void;
  onExportAll: () => void;
}

export const EtlSidebar: React.FC<EtlSidebarProps> = ({
  presets,
  activePresetId,
  onSelect,
  onDelete,
  onNew,
  onImport,
  onExport,
  onExportAll
}) => {
  const { t } = useLanguage();

  const sortedPresets = [...presets].sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    const nameComp = a.name.localeCompare(b.name);
    if (nameComp !== 0) return nameComp;
    return b.updatedAt - a.updatedAt;
  });

  return (
    <div className="station-card" style={{ height: '100%' }}>
      <div className="station-card-title">PRESETS_REGISTRY</div>
      
      <button 
        className="station-btn station-btn-primary" 
        style={{ width: '100%', padding: '15px', fontWeight: 900 }}
        onClick={onNew}
      >
        [+] {t('etl.new_preset')}
      </button>

      <div className="flex-row" style={{ justifyContent: 'space-between', padding: '10px 0', borderBottom: 'var(--border-thin) solid var(--border-color)' }}>
         <span style={{ fontSize: '0.7rem', fontWeight: 900, opacity: 0.5 }}>SYNCHRONIZATION</span>
         <div className="flex-row" style={{ gap: '10px' }}>
            <button className="station-btn" style={{ padding: '2px 8px', fontSize: '0.65rem', boxShadow: 'none' }} onClick={onImport}>JSON↓</button>
            <button className="station-btn" style={{ padding: '2px 8px', fontSize: '0.65rem', boxShadow: 'none' }} onClick={onExportAll}>ALL↑</button>
         </div>
      </div>

      <div className="flex-col" style={{ flex: 1, overflowY: 'auto', gap: '2px' }}>
        {sortedPresets.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', opacity: 0.2, fontWeight: 900 }}>EMPTY_REGISTRY</div>
        ) : (
          sortedPresets.map((p) => (
            <div 
              key={p.id} 
              className={`nav-item ${activePresetId === p.id ? 'active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 15px' }}
              onClick={() => onSelect(p)}
            >
              <ListIcon size={16} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 900, fontSize: '0.85rem' }}>{p.name}</span>
                <div style={{ display: 'flex', gap: '10px', fontSize: '0.65rem', opacity: 0.6 }}>
                  <span>V{p.version}</span>
                  <span className={`txt-${p.isActive ? 'ok' : 'err'}`} style={{ fontWeight: 900 }}>{p.isActive ? 'ACTIVE' : 'OFF'}</span>
                </div>
              </div>
              <div className="flex-row" style={{ gap: '5px' }}>
                <button 
                  className="station-btn"
                  style={{ padding: '4px', boxShadow: 'none', background: 'transparent' }}
                  onClick={(e) => { e.stopPropagation(); onExport(p); }}
                >
                  <DownloadIcon size={14} />
                </button>
                <button 
                  className="station-btn"
                  style={{ padding: '4px', boxShadow: 'none', background: 'transparent', color: 'var(--accent-color)' }}
                  onClick={(e) => { e.stopPropagation(); if (p.id) onDelete(p.id); }}
                >
                  <TrashIcon size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
