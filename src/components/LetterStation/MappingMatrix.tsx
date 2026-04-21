'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/db';
import { 
  LetterTemplate, 
  LetterMapping, 
  VariableMapping,
  CANONICAL_GAWEB_FIELDS 
} from '@/lib/types/letter.types';
import { 
  RefreshCwIcon, 
  SaveIcon, 
  SearchIcon,
  ListIcon,
  FileTextIcon,
  CogIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  PlusIcon,
  TrashIcon,
  MapIcon,
  UploadIcon,
  DownloadIcon,
  XIcon,
  UndoIcon
} from '@/components/common/Icons';
import JSZip from 'jszip';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useWorkspace } from '@/lib/context/WorkspaceContext';
import { ForbiddenPanel } from '@/components/common/ForbiddenPanel';
import { useIsNarrowLayout } from '@/lib/hooks/useIsNarrowLayout';
import { useTelemetryConfig } from '@/lib/context/TelemetryContext';
import { MappingMobileLayout } from './MappingMobileLayout';

/**
 * Industrial Mapping Coverage Core Logic
 */
export function getMappingCoverage(templateVars: string[], currentMapping: LetterMapping | null) {
  const totalVars = templateVars.length;
  const mappedCount = currentMapping
    ? currentMapping.mappings.filter(m => !!m.sourceField).length
    : 0;
  const pendingCount = totalVars - mappedCount;
  const coverage = totalVars > 0 ? mappedCount / totalVars : 0;

  return { totalVars, mappedCount, pendingCount, coverage };
}

const MappingMatrix: React.FC = () => {
  const { t } = useLanguage();
  const { can } = useWorkspace();
  const { config: telemetryConfig } = useTelemetryConfig();
  const isNarrow = useIsNarrowLayout(1000);
  
  const canEdit = can('LETTER_EDIT_MAPPINGS');
  const mobileLayoutEnabled = telemetryConfig?.security.uiFeatures.mappingMobileLayoutEnabled ?? true;

  if (!canEdit) {
    return <ForbiddenPanel capability="LETTER_EDIT_MAPPINGS" />;
  }

  const presets = useLiveQuery(() => db.presets_v6.toArray()) || [];
  const templates = useLiveQuery(() => db.lettertemplates_v6.toArray()) || [];
  const allMappings = useLiveQuery(() => db.lettermappings_v6.toArray()) || [];
  
  const [selectedMappingId, setSelectedMappingId] = useState<string | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [templateVars, setTemplateVars] = useState<string[]>([]);
  const [currentMapping, setCurrentMapping] = useState<LetterMapping | null>(null);

  const [isRegistryExpanded, setIsRegistryExpanded] = useState(true);
  const [isLinkerExpanded, setIsLinkerExpanded] = useState(true);
  
  // UI State
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [undoStack, setUndoStack] = useState<string[]>([]);

  const coverageStats = useMemo(
    () => getMappingCoverage(templateVars, currentMapping),
    [templateVars, currentMapping]
  );

  // LOGIC: Select Mapping from Registry
  const handleSelectMapping = (mapping: LetterMapping) => {
    setSelectedMappingId(mapping.id!);
    setSelectedPresetId(mapping.etlPresetId);
    setSelectedTemplateId(mapping.templateId);
    setCurrentMapping(mapping);
    setIsRegistryExpanded(false);
    setIsLinkerExpanded(false);
  };

  const recordSnapshot = () => {
    if (currentMapping) setUndoStack(prev => [...prev.slice(-19), JSON.stringify(currentMapping)]);
  };

  const undo = () => {
    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setCurrentMapping(JSON.parse(last));
  };

  const handleNewMapping = async () => {
    const name = `MAPEADO_AUTO_${allMappings.length + 1}`;
    
    const newMapping: LetterMapping = {
      name,
      etlPresetId: '',
      templateId: '',
      mappings: [],
      version: '1.0',
      isActive: false,
      updatedAt: Date.now()
    };

    const id = await db.lettermappings_v6.add(newMapping);
    setSelectedMappingId(id as string);
    setSelectedPresetId(null);
    setSelectedTemplateId(null);
    setCurrentMapping({ ...newMapping, id: id as string });
    setIsRegistryExpanded(false);
    setIsLinkerExpanded(true);
  };

  // Load Template Variables
  useEffect(() => {
    async function extractVars() {
      if (!selectedTemplateId) { setTemplateVars([]); return; }
      const template = templates.find(t => t.id === selectedTemplateId);
      if (!template) return;

      let vars: string[] = [];
      try {
        if (template.type === 'DOCX' && template.binaryContent) {
          const zip = await JSZip.loadAsync(template.binaryContent);
          const xmlFiles = Object.keys(zip.files).filter(name => name.endsWith('.xml'));
          const tagRegex = /\{\{(.*?)\}\}/g;
          for (const name of xmlFiles) {
             const content = await zip.file(name)?.async('text');
             if (content) {
                let match;
                while ((match = tagRegex.exec(content)) !== null) {
                   const tag = match[1].trim().replace(/<[^>]*>?/gm, '');
                   if (tag) vars.push(tag);
                }
             }
          }
        } else if (template.content) {
          const regex = /\{\{(.*?)\}\}/g;
          let match;
          while ((match = regex.exec(template.content)) !== null) {
            vars.push(match[1].trim());
          }
        }
      } catch (e) { console.error(e); }
      setTemplateVars(Array.from(new Set(vars)));
    }
    extractVars();
  }, [selectedTemplateId, templates]);

  const handleUpdateMapping = (templateVar: string, sourceType: VariableMapping['sourceType'], sourceField: string) => {
    if (!currentMapping) return;
    const newMappings = [...currentMapping.mappings];
    const idx = newMappings.findIndex(m => m.templateVar === templateVar);
    if (idx !== -1) {
      newMappings[idx] = { ...newMappings[idx], sourceType, sourceField };
    } else {
      newMappings.push({ templateVar, sourceType, sourceField });
    }
    setCurrentMapping({ ...currentMapping, mappings: newMappings });
  };

  const handleAutoMap = () => {
    if (!selectedPresetId || !templateVars.length || !currentMapping) return;
    const preset = presets.find(p => p.id === selectedPresetId);
    if (!preset) return;
    const dataRT = preset.recordTypes.find(rt => rt.name === 'DATA') || preset.recordTypes[0];
    const fields = dataRT?.fields || [];
    const newMappings: VariableMapping[] = templateVars.map(v => {
      // Direct Match con normalización robusta
      const match = fields.find(f => {
         const fName = (f.name || "").toLowerCase();
         return fName === v.toLowerCase();
      });
      if (match) return { templateVar: v, sourceType: 'TEMPLATE', sourceField: match.name };
      const gaMatch = CANONICAL_GAWEB_FIELDS.find(g => g.toLowerCase() === v.toLowerCase());
      if (gaMatch) return { templateVar: v, sourceType: 'GAWEB', sourceField: gaMatch };
      return { templateVar: v, sourceType: 'UI_OVERRIDE', sourceField: '' };
    });
    recordSnapshot();
    setCurrentMapping({ ...currentMapping, mappings: newMappings });
  };

  const saveMapping = async () => {
    if (!currentMapping || !selectedPresetId || !selectedTemplateId) {
      return;
    }
    try {
      recordSnapshot();
      const payload = { ...currentMapping, etlPresetId: selectedPresetId!, templateId: selectedTemplateId!, updatedAt: Date.now() };
      const id = await db.lettermappings_v6.put(payload);
      setSelectedMappingId(id as string);
      setIsLinkerExpanded(false);
    } catch (err) {}
  };

  const handleDeleteMapping = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm(t('common.confirm_delete').toUpperCase())) {
      await db.lettermappings_v6.delete(id);
      if (selectedMappingId === id) setSelectedMappingId(null);
    }
  };

  const handleExportAll = async () => {
    const data = await db.lettermappings_v6.toArray();
    const exportPath = { type: 'abdfn_mappings_backup', payload: data, exportedAt: Date.now() };
    const blob = new Blob([JSON.stringify(exportPath, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ABDFN_MAPPINGS_${new Date().toISOString().split('T')[0]}.json`;
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
          const data = JSON.parse(text);
          if (data.type === 'abdfn_mappings_backup' && Array.isArray(data.payload)) {
            for (const m of data.payload) {
              const { id, ...cleanMapping } = m; 
              await db.lettermappings_v6.add(cleanMapping);
            }
          }
        } catch (err) {}
      }
    };
    input.click();
  };

  const selectedPreset = presets.find(p => p.id === selectedPresetId);
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
  const dataRT = selectedPreset?.recordTypes.find(rt => rt.name === 'DATA') || selectedPreset?.recordTypes[0];

  return (
    <div className="flex-col" style={{ gap: '24px' }}>
      <section className="station-registry">
         <div className="station-registry-header" onClick={() => setIsRegistryExpanded(!isRegistryExpanded)}>
            <div className="station-registry-title"><ListIcon size={18} /> {t('letter.ui.mapping_brain').toUpperCase()} ({allMappings.length})</div>
            {isRegistryExpanded ? <ArrowUpIcon size={20} /> : <ArrowDownIcon size={20} />}
         </div>
         <div className={`station-registry-anim-container ${isRegistryExpanded ? 'expanded' : ''}`}>
           <div className="station-registry-anim-content">
             <div className="station-registry-content">
                <div className="station-registry-actions" style={{ justifyContent: 'space-between' }}>
                   <div className="flex-row" style={{ gap: '8px' }}>
                     <button className="station-btn" onClick={handleExportAll}><DownloadIcon size={14} /> JSON↓</button>
                     <button className="station-btn" onClick={handleImport} disabled={!canEdit}><UploadIcon size={14} /> ALL↑</button>
                   </div>
                   <button className="station-btn station-btn-primary" onClick={handleNewMapping} disabled={!canEdit} style={{ flex: 1, maxWidth: '300px' }}>{t('letter.ui.btn_generate').toUpperCase()}</button>
                </div>
                <div className="station-registry-list">
                  {allMappings.sort((a,b) => (b.updatedAt || 0) - (a.updatedAt || 0)).map(m => (
                    <div key={m.id} className={`station-registry-item ${selectedMappingId === m.id ? 'active' : ''}`} onClick={() => handleSelectMapping(m)}>
                      <div className="station-registry-item-left">
                        <div className="station-registry-item-icon"><MapIcon size={16} /></div>
                        <div className="station-registry-item-info">
                          <span className="station-registry-item-name">{m.name}</span>
                          <span className="station-registry-item-meta">{presets.find(p => p.id === m.etlPresetId)?.name || '---'} {' -> '} {templates.find(t => t.id === m.templateId)?.name || '---'}</span>
                        </div>
                      </div>
                      <button className="station-registry-action-btn" onClick={(e) => handleDeleteMapping(e, m.id!)} disabled={!canEdit}><TrashIcon size={14} /></button>
                    </div>
                  ))}
                </div>
             </div>
           </div>
         </div>
      </section>

      {!selectedMappingId && (
        <div className="station-empty-state">
          <MapIcon size={64} style={{ marginBottom: '16px' }} />
          <span className="station-shimmer-text">MAPPING_ENGINE_STANDBY</span>
        </div>
      )}

      {(selectedMappingId || currentMapping) && (
        <div className="station-card">
           <div className="station-panel-header">
              <div className="flex-col"><h2 className="station-title-main" style={{ margin: 0 }}>{currentMapping?.name}</h2></div>
              <div className="flex-row" style={{ gap: '12px' }}>
                <button className="station-btn" onClick={undo} disabled={undoStack.length === 0 || !canEdit}><UndoIcon size={16} /></button>
                <button className="station-btn" onClick={() => setShowConfigModal(true)}><CogIcon size={16} /> {t('settings.title').toUpperCase()}</button>
                <button className="station-btn station-btn-primary" onClick={saveMapping} disabled={!canEdit}><SaveIcon size={16} /> {t('common.save').toUpperCase()}</button>
              </div>
           </div>
           <div className="station-tech-summary" style={{ marginTop: '16px' }}>
              <div className="station-tech-item"><span className="station-tech-label">{t('letter.ui.resources')}:</span> {selectedPreset?.name || '---'}</div>
              <div className="station-tech-item"><span className="station-tech-label">{t('letter.ui.output_format')}:</span> {selectedTemplate?.name || '---'}</div>
           </div>
        </div>
      )}

      {(selectedMappingId || currentMapping) && (
        <section className="station-registry">
           <div className="station-registry-header" onClick={() => setIsLinkerExpanded(!isLinkerExpanded)}>
              <div className="station-registry-title"><CogIcon size={16} /> RESOURCE_LINKER</div>
              {isLinkerExpanded ? <ArrowUpIcon size={18} /> : <ArrowDownIcon size={18} />}
           </div>
            <div className={`station-registry-anim-container ${isLinkerExpanded ? 'expanded' : ''}`}>
             <div className="station-registry-anim-content"><div className="station-registry-content"><div className="station-form-grid">
               <div className="station-form-field"><label className="station-label">{t('letter.ui.data_file').toUpperCase()}</label><select className="station-select" value={selectedPresetId || ''} onChange={e => setSelectedPresetId(e.target.value)} disabled={!canEdit}><option value="">-- {t('letter.ui.waiting_data').toUpperCase()} --</option>{presets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
               <div className="station-form-field"><label className="station-label">{t('letter.ui.template_visual').toUpperCase()}</label><select className="station-select" value={selectedTemplateId || ''} onChange={e => setSelectedTemplateId(e.target.value)} disabled={!canEdit}><option value="">-- {t('letter.ui.select_template').toUpperCase()} --</option>{templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
             </div></div></div>
           </div>
        </section>
      )}

      {selectedPresetId && selectedTemplateId && (
        <div className="flex-col" style={{ marginTop: '24px', gap: '20px', minHeight: '600px' }}>
          {(isNarrow && mobileLayoutEnabled) ? (
            <MappingMobileLayout 
              mapping={currentMapping}
              templateVars={templateVars}
              dataFields={dataRT?.fields.map((f: any) => f.Name || f.name) || []}
              gawebFields={CANONICAL_GAWEB_FIELDS}
              coverageStats={coverageStats}
              onUpdateMapping={handleUpdateMapping}
              onClearMapping={(v) => handleUpdateMapping(v, 'UI_OVERRIDE', '')}
              onAutoMap={handleAutoMap}
              onSave={saveMapping}
              onUndo={undo}
            />
          ) : (
            <>
              <div className="station-toolbar">
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className="station-badge station-badge-blue">M</span>
                    <span style={{ fontWeight: 800 }}>{t('letter.ui.mapping_brain').toUpperCase()}</span>
                  </div>
                  <div className="flex-row" style={{ gap: '8px' }}>
                    <span className="station-badge" style={{ background: 'rgba(56, 189, 248, 0.1)', color: 'var(--primary-color)' }}>
                      {coverageStats.mappedCount}/{coverageStats.totalVars} ({Math.round(coverageStats.coverage * 100)}%)
                    </span>
                    {coverageStats.pendingCount > 0 && (
                      <span className="station-badge err">
                        {coverageStats.pendingCount} PENDIENTES
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="station-btn" onClick={handleAutoMap} disabled={!canEdit}><RefreshCwIcon size={14} /> {t('letter.ui.auto_map').toUpperCase()}</button>
                  <button className="station-btn station-btn-primary" onClick={saveMapping} disabled={!canEdit}><SaveIcon size={14} /> {t('common.save').toUpperCase()}</button>
                </div>
              </div>
              <div className="station-table-container">
                <table className="station-table">
                  <thead><tr><th style={{ width: '40px' }}>TYP</th><th>{t('etl.field_name').toUpperCase()}</th><th>SOURCE</th><th style={{ width: '120px' }}>STATUS</th></tr></thead>
                  <tbody>
                    {templateVars.map(v => {
                      const map = currentMapping?.mappings.find(m => m.templateVar === v);
                      return (
                        <tr key={v}>
                          <td>{map?.sourceType === 'TEMPLATE' ? 'W' : 'G'}</td>
                          <td style={{ fontWeight: 800 }}>{`{{${v}}}`}</td>
                          <td>
                              <select className="station-select" style={{ fontSize: '0.8rem' }} value={map ? `${map.sourceType}:${map.sourceField}` : ''} onChange={e => { const [type, field] = e.target.value.split(':'); handleUpdateMapping(v, type as any, field); }} disabled={!canEdit}>
                                <option value="">-- {t('letter.ui.select_mapping').toUpperCase()} --</option>
                                <optgroup label="[CSV] COLUMNS">
                                    {dataRT?.fields.map((f: any, idx: number) => (
                                      <option key={idx} value={`TEMPLATE:${f.Name || f.name}`}>{f.Name || f.name}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="[GAWEB] TECHNICALS">{CANONICAL_GAWEB_FIELDS.map(g => <option key={g} value={`GAWEB:${g}`}>{g}</option>)}</optgroup>
                              </select>
                          </td>
                          <td>{map?.sourceField ? 'LINKED' : 'PENDING'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Sello de Integridad (Era 6) */}
      <div className="station-integrity-badge" style={{ position: 'fixed', bottom: '24px', right: '24px' }}>
         <div className="integrity-dot" />
         <FileTextIcon size={14} />
         <span>ESTÁNDAR GAWEB v.1 (ERA 6)</span>
      </div>
    </div>
  );
};

export default MappingMatrix;
