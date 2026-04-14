'use client';

import React from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { EtlPreset } from '@/lib/types/etl.types';
import { ListIcon, DownloadIcon, TrashIcon } from '@/components/common/Icons';
import styles from './EtlSidebar.module.css';

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
    // 1. Status (Active first)
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;

    // 2. Name
    const nameComp = a.name.localeCompare(b.name);
    if (nameComp !== 0) return nameComp;

    // 3. Version (Descending)
    const verComp = (b.version || '').localeCompare(a.version || '');
    if (verComp !== 0) return verComp;

    // 4. Date (Descending)
    return b.updatedAt - a.updatedAt;
  });

  return (
    <div className="module-section" style={{ height: '100%', gap: '16px' }}>
      <button 
        className="glass" 
        style={{ 
          width: '100%', 
          padding: '12px', 
          fontWeight: 900, 
          background: 'var(--border-color)', 
          color: 'var(--bg-color)',
          textTransform: 'uppercase',
          marginBottom: '8px'
        }}
        onClick={onNew}
      >
        + {t('etl.new_preset')}
      </button>

      <header className={styles.header}>
        <h3 className={styles.title}>PRESETS_DB</h3>
        <div className={styles.actions}>
          <button onClick={onImport} className={styles.miniBtn} title={t('etl.import')}>JSON↓</button>
          <button onClick={onExportAll} className={styles.miniBtn} title={t('etl.export')}>ALL↑</button>
        </div>
      </header>

      <div className={styles.list}>
        {sortedPresets.length === 0 ? (
          <div className={styles.empty}>
            {t('etl.no_presets')}
          </div>
        ) : (
          sortedPresets.map((p) => (
            <div 
              key={p.id} 
              className={`${styles.item} ${activePresetId === p.id ? styles.active : ''}`}
              onClick={() => onSelect(p)}
            >
              <ListIcon size={18} />
              <div className={styles.itemInfo}>
                <span className={styles.itemName}>{p.name}</span>
                <div className={styles.itemMeta}>
                  <span className={styles.itemDate}>
                    {new Date(p.updatedAt).toLocaleDateString()}
                  </span>
                  <span>V{p.version}</span>
                  <span className={p.isActive ? styles.statusActive : styles.statusInactive}>
                    {p.isActive ? 'ACTIVO' : 'INACTIVO'}
                  </span>
                </div>
              </div>
              <div className={styles.itemActions}>
                <button 
                  className={styles.actionIconBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    onExport(p);
                  }}
                  title={t('etl.export')}
                >
                  <DownloadIcon size={16} />
                </button>
                <button 
                  className={styles.deleteBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (p.id) onDelete(p.id);
                  }}
                >
                  <TrashIcon size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
