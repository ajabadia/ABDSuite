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
import { ForbiddenPanel } from '@/components/common/ForbiddenPanel';
import { useWorkspace } from '@/lib/context/WorkspaceContext';

import { auditService } from '@/lib/services/AuditService';

const STORAGE_KEY = 'abdfn_etl_global_settings';
const DEFAULT_SETTINGS: EtlGlobalSettings = {
  defaultPath: 'C:\\ABD\\ETL',
  language: 'es',
  defaultEncoding: 'utf-8',
  defaultChunkSize: 900000
};

function EtlPageContent() {
  const { t } = useLanguage();
  const { can, currentOperator } = useWorkspace();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  if (!can('ETL_VIEW')) {
    return <ForbiddenPanel />;
  }

  const activeTab = (searchParams.get('view') === 'executor' || searchParams.get('view') === 'runner') ? 'runner' : 'designer';
  const idParam = searchParams.get('id');

  const canEditPresets = can('ETL_EDIT_PRESETS');
  const canRun = can('ETL_RUN');
  const canConfig = can('ETL_CONFIG_GLOBAL');
  
  const [selectedPreset, setSelectedPreset] = useState<EtlPreset | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [etlSettings, setEtlSettings] = useState<EtlGlobalSettings>(DEFAULT_SETTINGS);

  // ... (useLiveQuery remains)
  const presets = useLiveQuery(() => db.presets_v6.toArray()) || [];

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

  useEffect(() => {
    if (idParam && presets.length > 0) {
      if (selectedPreset?.id !== idParam) {
        const p = presets.find(x => x.id === idParam);
        if (p) setSelectedPreset(p);
      }
    }
  }, [idParam, presets, selectedPreset?.id]);

  const saveGlobalSettings = async (newSettings: EtlGlobalSettings) => {
    if (!canConfig) return;
    setEtlSettings(newSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));

    await auditService.log({
      module: 'ETL',
      messageKey: 'etl.config.update',
      status: 'WARNING',
      operatorId: currentOperator?.id,
      details: {
        eventType: 'ETL_CONFIG_UPDATE',
        entityType: 'ETL_CONFIG',
        entityId: 'GLOBAL',
        actorId: currentOperator?.id,
        actorUser: currentOperator?.username,
        severity: 'WARN',
        context: {
          updatedKeys: Object.keys(newSettings).join(', ')
        }
      }
    });
  };

  const handleNew = async () => {
    if (!canEditPresets) return;
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
    const id = await db.presets_v6.add(newPreset);
    router.push(`/etl?view=${activeTab}&id=${id}`);
  };

  const handleSave = async () => {
    if (!canEditPresets || !selectedPreset || !selectedPreset.id) return;
    await db.presets_v6.put(selectedPreset);
  };

  const handleDelete = async (id: string) => {
    if (!canEditPresets) return;
    if (confirm(t('common.confirm_delete') || 'DELETE?')) {
      await db.presets_v6.delete(id);
      if (selectedPreset?.id === id) {
        setSelectedPreset(null);
        router.push(`/etl?view=${activeTab}`);
      }
    }
  };

  const handleExport = (preset: EtlPreset) => {
    // Export is usually safe for VIEWERS too, but we could restrict it.
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
    if (!canEditPresets) return;
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
          const id = await db.presets_v6.add(normalized);
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
        readOnly={!canConfig}
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
            canEdit={canEditPresets}
          />
        </section>

        {selectedPreset ? (
          <section style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ flex: 1, minHeight: 0 }}>
              {activeTab === 'designer' ? (
                <EtlDesigner 
                  preset={selectedPreset} 
                  onUpdate={setSelectedPreset} 
                  onSave={handleSave}
                  canEdit={canEditPresets}
                />
              ) : (
                <EtlRunner 
                  presets={presets}
                  selectedPreset={selectedPreset}
                  onSelect={handleSelectPreset}
                />
              )}
            </div>
          </section>
        ) : (
          <div className="station-empty-state" style={{ flex: 1 }}>
             <MapIcon size={64} style={{ marginBottom: '16px' }} />
             <span className="station-shimmer-text">{t('etl.designer_standby').toUpperCase()}</span>
          </div>
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
