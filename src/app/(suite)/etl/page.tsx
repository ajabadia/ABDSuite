'use client';

import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useLanguage } from '@/lib/context/LanguageContext';
import { db } from '@/lib/db/db';
import { EtlPreset } from '@/lib/types/etl.types';
import { normalizeEtlPreset } from '@/lib/utils/etl-importer';
import { EtlSidebar } from '@/components/Etl/EtlSidebar';
import { EtlDesigner } from '@/components/Etl/EtlDesigner';
import { CogIcon } from '@/components/common/Icons';
import EtlSettingsModal from '@/components/Etl/EtlSettingsModal';
import { EtlGlobalSettings } from '@/lib/types/etl.types';
import EtlRunner from '@/components/Etl/EtlRunner';

const STORAGE_KEY = 'abdfn_etl_global_settings';

const DEFAULT_SETTINGS: EtlGlobalSettings = {
  defaultPath: 'C:\\ABD\\ETL',
  language: 'es',
  defaultEncoding: 'utf-8',
  defaultChunkSize: 900000
};

export default function EtlPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'designer' | 'runner'>('designer');
  const [selectedPreset, setSelectedPreset] = useState<EtlPreset | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [etlSettings, setEtlSettings] = useState<EtlGlobalSettings>(DEFAULT_SETTINGS);

  // Load Global Settings
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setEtlSettings(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse ETL settings', e);
      }
    }
  }, []);

  const saveGlobalSettings = (newSettings: EtlGlobalSettings) => {
    setEtlSettings(newSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
  };

  // Persistence (Dexie)
  const presets = useLiveQuery(() => db.presets.toArray()) || [];

  const handleNew = async () => {
    const newPreset: EtlPreset = {
      name: 'NEW_PRESET_' + (presets.length + 1),
      version: '1.0',
      description: '',
      chunkSize: etlSettings.defaultChunkSize,
      encoding: etlSettings.defaultEncoding,
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
    <div className="module-grid" style={{ gridTemplateColumns: '350px 1fr' }}>
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

      <section className="module-col-main" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="station-tabs" style={{ background: 'transparent', borderBottom: 'none' }}>
            <button 
              className={`tab-item ${activeTab === 'designer' ? 'active' : ''}`}
              onClick={() => setActiveTab('designer')}
              style={{ padding: '8px 25px', boxShadow: activeTab === 'designer' ? 'none' : 'inset 0 -5px 0 rgba(0,0,0,0.2)' }}
            >
              {t('etl.designer')}
            </button>
            <button 
              className={`tab-item ${activeTab === 'runner' ? 'active' : ''}`}
              onClick={() => setActiveTab('runner')}
              style={{ padding: '8px 25px', boxShadow: activeTab === 'runner' ? 'none' : 'inset 0 -5px 0 rgba(0,0,0,0.2)' }}
            >
              {t('etl.runner')}
            </button>
          </div>
          
          <button 
            className="station-btn"
            onClick={() => setIsSettingsOpen(true)}
            title={t('etl.preferences')}
            style={{ padding: '8px', boxShadow: 'none' }}
          >
            <CogIcon size={18} />
          </button>
        </div>

        <EtlSettingsModal 
          isOpen={isSettingsOpen}
          initialSettings={etlSettings}
          onClose={() => setIsSettingsOpen(false)}
          onSave={saveGlobalSettings}
        />

        <div style={{ flex: 1, minHeight: 0 }}>
          {activeTab === 'designer' ? (
            selectedPreset ? (
              <EtlDesigner 
                preset={selectedPreset} 
                onUpdate={setSelectedPreset} 
                onSave={handleSave}
              />
            ) : (
              <div className="station-card" style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.1 }}>
                 <CogIcon size={80} />
                 <p style={{ fontWeight: 900, marginTop: '20px' }}>SELECT_ETL_PRESET_TO_INITIALIZE</p>
              </div>
            )
          ) : (
            <EtlRunner 
              presets={presets}
              selectedPreset={selectedPreset}
              onSelectPreset={setSelectedPreset}
            />
          )}
        </div>
      </section>
    </div>
  );
}
