'use client';

import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useLanguage } from '@/lib/context/LanguageContext';
import { db } from '@/lib/db/db';
import { EtlPreset } from '@/lib/types/etl.types';
import { normalizeEtlPreset } from '@/lib/utils/etl-importer';
import { EtlSidebar } from '@/components/Etl/EtlSidebar';
import { EtlDesigner } from '@/components/Etl/EtlDesigner';

export default function EtlPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'designer' | 'runner'>('designer');
  const [selectedPreset, setSelectedPreset] = useState<EtlPreset | null>(null);

  // Persistence (Dexie)
  const presets = useLiveQuery(() => db.presets.toArray()) || [];

  const handleNew = async () => {
    const newPreset: EtlPreset = {
      name: 'NEW_PRESET_' + (presets.length + 1),
      version: '1.0',
      description: '',
      chunkSize: 900000,
      encoding: 'utf-8',
      recordTypeStart: 0,
      recordTypeLen: 0,
      defaultRecordType: '',
      headerTypeId: '',
      recordTypes: [],
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    const id = await db.presets.add(newPreset);
    setSelectedPreset({ ...newPreset, id: id as number });
  };

  const handleSave = async () => {
    if (!selectedPreset || !selectedPreset.id) return;
    await db.presets.update(selectedPreset.id, selectedPreset);
    // Explicit save feedback could be added in StatusBar
  };

  const handleDelete = async (id: number) => {
    if (confirm(t('common.confirm_delete') || 'DELETE?')) {
      await db.presets.delete(id);
      if (selectedPreset?.id === id) setSelectedPreset(null);
    }
  };

  const handleExport = (preset: EtlPreset) => {
    const data = JSON.stringify(preset, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `etl_preset_${preset.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAll = async () => {
    const data = JSON.stringify(presets, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `abdfn_etl_presets_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    // Basic Import logic for B2
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        try {
          const text = await file.text();
          const rawData = JSON.parse(text);
          const normalized = normalizeEtlPreset(rawData);
          const id = await db.presets.add(normalized);
          setSelectedPreset({ ...normalized, id: id as number });
        } catch (err) {
          console.error('FAILED_TO_IMPORT_Preset', err);
        }
      }
    };
    input.click();
  };

  return (
    <div className="module-grid" style={{ gridTemplateColumns: '450px 1fr' }}>
      <section className="module-col-side">
        <EtlSidebar 
          presets={presets}
          activePresetId={selectedPreset?.id}
          onSelect={setSelectedPreset}
          onDelete={handleDelete}
          onExport={handleExport}
          onNew={handleNew}
          onImport={handleImport}
          onExportAll={handleExportAll}
        />
      </section>

      <section className="module-col-main">
        <header className="module-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <span>{t('shell.etl')}</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => setActiveTab('designer')}
              style={{ 
                background: activeTab === 'designer' ? 'var(--bg-color)' : 'transparent',
                color: activeTab === 'designer' ? 'var(--text-primary)' : 'var(--bg-color)',
                border: 'none',
                padding: '4px 12px',
                fontWeight: 900,
                cursor: 'pointer'
              }}
            >
              {t('etl.designer')}
            </button>
            <button 
              onClick={() => setActiveTab('runner')}
              style={{ 
                background: activeTab === 'runner' ? 'var(--bg-color)' : 'transparent',
                color: activeTab === 'runner' ? 'var(--text-primary)' : 'var(--bg-color)',
                border: 'none',
                padding: '4px 12px',
                fontWeight: 900,
                cursor: 'pointer'
              }}
            >
              {t('etl.runner')}
            </button>
          </div>
        </header>

        <div className="module-section">
          {activeTab === 'designer' ? (
            selectedPreset ? (
              <EtlDesigner 
                preset={selectedPreset} 
                onUpdate={setSelectedPreset} 
                onSave={handleSave}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '60px', opacity: 0.3 }}>
                <h3>ETL_DESIGNER_IDLE</h3>
                <p>SELECT_OR_CREATE_PRESET_TO_START</p>
              </div>
            )
          ) : (
            <div style={{ textAlign: 'center', padding: '60px', opacity: 0.3 }}>
              <h3>ETL_RUNNER_V1</h3>
              <p>Hito B3 - COMING_SOON</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
