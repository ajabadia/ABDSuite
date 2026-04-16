import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { EtlPreset } from '@/lib/types/etl.types';
import { ListIcon, DownloadIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon } from '@/components/common/Icons';

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
  const [isCollapsed, setIsCollapsed] = useState(false);

  const activePreset = presets.find(p => p.id === activePresetId);

  // Auto-collapse when a preset is selected
  useEffect(() => {
    if (activePresetId) {
      setIsCollapsed(true);
    }
  }, [activePresetId]);

  const sortedPresets = [...presets].sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="station-card" style={{ height: 'auto', transition: 'all 0.3s ease' }}>
      <div 
        className="station-card-title" 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          cursor: 'pointer',
          userSelect: 'none'
        }}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          PRESETS_REGISTRY 
          {activePreset && (
            <span style={{ opacity: 0.5, fontWeight: 400 }}>
               {` > `} <span style={{ color: 'var(--primary-color)', fontWeight: 800 }}>{activePreset.name}</span>
            </span>
          )}
        </div>
        <div style={{ opacity: 0.5 }}>
          {isCollapsed ? <ArrowDownIcon size={18} /> : <ArrowUpIcon size={18} />}
        </div>
      </div>
      
      {!isCollapsed && (
        <div className="flex-col" style={{ gap: '16px', marginTop: '16px' }}>
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

          <div className="flex-col" style={{ maxHeight: '400px', overflowY: 'auto', gap: '2px' }}>
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
      )}
    </div>
  );
};
