import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { EtlPreset } from '@/lib/types/etl.types';
import { ListIcon, DownloadIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon, UploadIcon } from '@/components/common/Icons';

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
    <div className="station-registry">
      <div 
        className="station-registry-header" 
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="station-registry-title">
          <ListIcon size={18} />
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
        <div className="station-registry-content">
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="station-btn station-btn-primary" 
              style={{ flex: 1, padding: '15px', fontWeight: 900 }}
              onClick={onNew}
            >
              [+] {t('etl.new_preset')}
            </button>
            <button 
              className="station-btn" 
              style={{ width: '64px', padding: 0 }} 
              onClick={onImport}
              title="Importar Backup (.json)"
            >
              <UploadIcon size={20} />
            </button>
          </div>

          <div className="flex-col" style={{ gap: '8px' }}>
            <div className="station-registry-sync-header">
               <span className="station-registry-sync-title">SYNCHRONIZATION</span>
               <div className="station-registry-sync-actions">
                  <button className="station-registry-sync-btn" onClick={onImport}>JSON↓</button>
                  <button className="station-registry-sync-btn" onClick={onExportAll}>ALL↑</button>
               </div>
            </div>

            <div className="station-registry-list">
              {sortedPresets.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', opacity: 0.2, fontWeight: 900 }}>EMPTY_REGISTRY</div>
              ) : (
                sortedPresets.map((p) => (
                  <div 
                    key={p.id} 
                    className={`station-registry-item ${activePresetId === p.id ? 'active' : ''}`}
                    onClick={() => onSelect(p)}
                  >
                    <div className="station-registry-item-left">
                       <div className="station-registry-item-icon"><ListIcon size={16} /></div>
                       <div className="station-registry-item-info">
                          <span className="station-registry-item-name">{p.name}</span>
                          <span className="station-registry-item-meta">
                             V{p.version} <span className={`station-registry-item-status txt-${p.isActive ? 'ok' : 'err'}`} style={{ fontWeight: 900 }}>{p.isActive ? 'ACTIVE' : 'OFF'}</span>
                          </span>
                       </div>
                    </div>

                    <div className="station-registry-item-actions">
                      <button 
                        className="station-registry-action-btn"
                        onClick={(e) => { e.stopPropagation(); onExport(p); }}
                        title="Exportar Preset"
                      >
                        <DownloadIcon size={16} />
                      </button>
                      <button 
                        className="station-registry-action-btn err"
                        onClick={(e) => { e.stopPropagation(); if (p.id) onDelete(p.id); }}
                        title="Eliminar"
                      >
                        <TrashIcon size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
