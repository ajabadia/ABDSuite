'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/context/LanguageContext';
import { db } from '@/lib/db/db';
import { EtlPreset } from '@/lib/types/etl.types';
import { normalizeEtlPreset } from '@/lib/utils/etl-importer';
import { EtlSidebar } from '@/components/Etl/EtlSidebar';
import { EtlDesigner } from '@/components/Etl/EtlDesigner';
import { CogIcon, MapIcon, PlayIcon } from '@/components/common/Icons';
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

function EtlPageContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const activeTab = (searchParams.get('view') === 'executor' || searchParams.get('view') === 'runner') ? 'runner' : 'designer';
  const idParam = searchParams.get('id');
  
  const [selectedPreset, setSelectedPreset] = useState<EtlPreset | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [etlSettings, setEtlSettings] = useState<EtlGlobalSettings>(DEFAULT_SETTINGS);

  // Persistence (Dexie)
  const presets = useLiveQuery(() => db.presets.toArray()) || [];

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

  // Sync selectedPreset with URL ID param
  useEffect(() => {
    if (idParam && presets.length > 0) {
      const pid = parseInt(idParam);
      if (selectedPreset?.id !== pid) {
        const p = presets.find(x => x.id === pid);
        if (p) setSelectedPreset(p);
      }
    }
  }, [idParam, presets, selectedPreset?.id]);

  const saveGlobalSettings = (newSettings: EtlGlobalSettings) => {
    setEtlSettings(newSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
  };

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
    router.push(`/etl?view=${activeTab}&id=${id}`);
  };

  const handleSave = async () => {
    if (!selectedPreset || !selectedPreset.id) return;
    await db.presets.put(selectedPreset);
  };

  const handleDelete = async (id: number) => {
    if (confirm(t('common.confirm_delete') || 'DELETE?')) {
      await db.presets.delete(id);
      if (selectedPreset?.id === id) {
        setSelectedPreset(null);
        router.push(`/etl?view=${activeTab}`);
      }
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
          router.push(`/etl?view=${activeTab}&id=${id}`);
        } catch (err) {
          console.error('FAILED_TO_IMPORT_Preset', err);
        }
      }
    };
    input.click();
  };

  const handleSelectPreset = (p: EtlPreset) => {
    setSelectedPreset(p);
    router.push(`/etl?view=${activeTab}&id=${p.id}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
      <header className="module-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '1.2rem', fontWeight: 800 }}>
          {activeTab === 'designer' ? (
            <>
              <MapIcon size={24} style={{ opacity: 0.6 }} />
              {t('etl.app_designer')}
            </>
          ) : (
            <>
              <PlayIcon size={24} style={{ opacity: 0.6 }} />
              {t('etl.app_executor')}
            </>
          )}
        </div>
        <button 
          className="station-btn"
          onClick={() => setIsSettingsOpen(true)}
          title={t('etl.preferences')}
          style={{ padding: '4px', boxShadow: 'none', background: 'transparent', border: 'none' }}
        >
          <CogIcon size={20} />
        </button>
      </header>
      
      <EtlSettingsModal 
        isOpen={isSettingsOpen}
        initialSettings={etlSettings}
        onClose={() => setIsSettingsOpen(false)}
        onSave={saveGlobalSettings}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '64px', flex: 1, minHeight: 0 }}>
        <section style={{ display: 'flex', flexDirection: 'column' }}>
          <EtlSidebar 
            presets={presets}
            activePresetId={selectedPreset?.id}
            onSelect={handleSelectPreset}
            onDelete={handleDelete}
            onExport={handleExport}
            onNew={handleNew}
            onImport={handleImport}
            onExportAll={handleExportAll}
          />
        </section>

        {selectedPreset && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ flex: 1, minHeight: 0 }}>
              {activeTab === 'designer' ? (
                <EtlDesigner 
                  preset={selectedPreset} 
                  onUpdate={setSelectedPreset} 
                  onSave={handleSave}
                />
              ) : (
                <EtlRunner 
                  presets={presets}
                  selectedPreset={selectedPreset}
                  onSelectPreset={handleSelectPreset}
                />
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default function EtlPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EtlPageContent />
    </Suspense>
  );
}
