'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/db';
import { LetterTemplate, LetterMapping, LetterGenerationOptions } from '@/lib/types/letter.types';
import LogConsole, { LogEntry } from '@/components/LogConsole';
import { RefreshIcon, EyeIcon, FolderIcon, ListIcon, CogIcon } from '@/components/common/Icons';
import DataPreviewModal from './DataPreviewModal';
import PresetEditorModal from './PresetEditorModal';
import PreferencesModal from './PreferencesModal';
import { EtlPreset, EtlGlobalSettings } from '@/lib/types/etl.types';

interface LetterStationProps {
  onOpenMapping: () => void;
}

const LetterStation: React.FC<LetterStationProps> = ({ onOpenMapping }) => {
  const { t } = useLanguage();
  const presets = useLiveQuery(() => db.presets.toArray()) || [];
  const templates = useLiveQuery(() => db.letter_templates.toArray()) || [];
  
  const [selectedEtlPresetId, setSelectedEtlPresetId] = useState<number | undefined>(undefined);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | undefined>(undefined);
  const [dataFile, setDataFile] = useState<File | null>(null);
  
  const [options, setOptions] = useState<LetterGenerationOptions>({
    lote: '0001',
    oficina: '00000',
    codDocumento: 'X00054',
    fechaGeneracion: new Date().toISOString().split('T')[0].replace(/-/g, ''),
    fechaCarta: new Date().toISOString().split('T')[0].replace(/-/g, ''),
    rangeFrom: 1,
    rangeTo: 0,
    outputType: 'PDF_GAWEB'
  });

  const [outputHandle, setOutputHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDataPreview, setShowDataPreview] = useState(false);
  const [showTagsPreview, setShowTagsPreview] = useState(false);
  const [showPresetEditor, setShowPresetEditor] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [editorPreset, setEditorPreset] = useState<EtlPreset | null>(null);
  const [settings, setSettings] = useState<EtlGlobalSettings>({
    defaultPath: 'C:\\ABD\\Presets',
    language: 'ES',
    defaultEncoding: 'utf-8',
    defaultChunkSize: 1000
  });
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = (type: LogEntry['type'], message: string) => {
    setLogs(prev => [...prev, { id: Math.random().toString(36).substring(2, 9), timestamp: new Date(), type, message }]);
  };

  const handleToday = (field: 'fechaGeneracion' | 'fechaCarta') => {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    setOptions({ ...options, [field]: today });
    addLog('info', `DATE_UPDATED: ${field} -> ${today}`);
  };

  const handleSavePreset = async (p: EtlPreset) => {
    try {
      const id = await db.presets.put({ ...p, updatedAt: Date.now() });
      setSelectedEtlPresetId(id);
      setShowPresetEditor(false);
      addLog('success', `PRESET_SAVED: ${p.name}`);
    } catch (err: any) { addLog('error', `FAILED_TO_SAVE_PRESET: ${err.message}`); }
  };

  const handleSaveSettings = (s: EtlGlobalSettings) => {
    setSettings(s);
    setShowPreferences(false);
    addLog('success', `PREFERENCES_UPDATED: Default path set to ${s.defaultPath}`);
  };

  const handlePickOutput = async () => {
    try {
      const handle = await (window as any).showDirectoryPicker();
      setOutputHandle(handle);
      addLog('info', `OUTPUT_DIR_SELECTED: ${handle.name}`);
    } catch (err) { }
  };

  const startGeneration = async () => {
    if (!dataFile || !outputHandle || !selectedEtlPresetId || !selectedTemplateId) return;
    setIsProcessing(true);
    addLog('info', 'STARTING_BATCH_GENERATION...');
    try {
      const template = templates.find(t => t.id === selectedTemplateId);
      const etlPreset = presets.find(p => p.id === selectedEtlPresetId);
      const mapping = await db.letter_mappings.where({ templateId: selectedTemplateId, etlPresetId: selectedEtlPresetId }).first();
      if (!mapping) {
        addLog('error', 'MISSING_FIELD_MAPPING_FOR_THIS_PRESET_TEMPLATE_PAIR');
        setIsProcessing(false);
        return;
      }
      const worker = new Worker(new URL('../../lib/workers/document-engine.worker.ts', import.meta.url));
      worker.onmessage = async (e) => {
        const { type, payload } = e.data;
        if (type === 'LOG') addLog(payload.type, payload.message);
        if (type === 'COMPLETE') {
          const zipBlob = payload;
          const fileName = `PACKAGE_${options.lote}_${Date.now()}.zip`;
          const fileHandle = await outputHandle.getFileHandle(fileName, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(zipBlob);
          await writable.close();
          addLog('success', `BATCH_COMPLETED_SUCCESSFULLY: ${fileName}`);
          setIsProcessing(false);
          worker.terminate();
        }
      };
      worker.postMessage({ dataFile, template, mapping, etlPreset, options });
    } catch (err: any) {
      addLog('error', `WORKER_INITIALIZATION_FAILED: ${err.message}`);
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-col" style={{ height: '100%', gap: '20px' }}>
      <div className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'center', background: 'rgba(var(--primary-color), 0.05)', padding: '5px 15px', border: 'var(--border-thin) solid var(--border-color)' }}>
         <div className="flex-row" style={{ gap: '20px' }}>
            <button className="station-btn" style={{ padding: '8px 12px', boxShadow: 'none' }} onClick={() => setShowPreferences(true)}>[PREFERENCES]</button>
            <button className="station-btn" style={{ padding: '8px 12px', boxShadow: 'none' }}>[IMPORT_TEMPLATE]</button>
         </div>
         <span style={{ fontSize: '0.7rem', fontWeight: 900, opacity: 0.5 }}>STATION_ALPHA / LETTER_GENERATOR</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px', flex: 1, minHeight: 0 }}>
        
        {/* Step 1 */}
        <div className="station-card">
          <div className="station-card-title">1. DATA_RESOURCES</div>
          <div className="flex-col" style={{ gap: '15px' }}>
            <div className="flex-col" style={{ gap: '5px' }}>
              <label className="station-label">{t('letter.preset_gaweb')}</label>
              <div className="flex-row" style={{ gap: '5px' }}>
                <select className="station-select" value={selectedEtlPresetId} onChange={(e) => setSelectedEtlPresetId(Number(e.target.value))}>
                  <option value="">{t('etl.no_presets')}</option>
                  {presets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <button className="station-btn" style={{ padding: '8px', boxShadow: 'none' }} onClick={() => { setEditorPreset(null); setShowPresetEditor(true); }}><CogIcon size={16} /></button>
              </div>
            </div>

            <div className="flex-col" style={{ gap: '5px' }}>
              <label className="station-label">{t('letter.data_file')}</label>
              <div className="flex-row" style={{ gap: '5px' }}>
                <div className="station-input" style={{ fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {dataFile ? dataFile.name : 'IDLE_WAITING_FILE'}
                </div>
                <input type="file" id="data-file-in" style={{ display: 'none' }} onChange={(e) => setDataFile(e.target.files?.[0] || null)} />
                <button className="station-btn" style={{ padding: '8px 15px', boxShadow: 'none' }} onClick={() => document.getElementById('data-file-in')?.click()}>...</button>
              </div>
            </div>

            <div className="flex-col" style={{ gap: '5px' }}>
              <label className="station-label">{t('letter.template_file')}</label>
              <div className="flex-row" style={{ gap: '5px' }}>
                <select className="station-select" value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(Number(e.target.value))}>
                  <option value="">-- SELECT TEMPLATE --</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <button className="station-btn" style={{ padding: '8px 15px', boxShadow: 'none' }} onClick={() => setShowTagsPreview(true)}><EyeIcon size={16} /></button>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="station-card">
          <div className="station-card-title">2. METADATA_PARAMETERS</div>
          <div className="grid-2" style={{ gap: '15px' }}>
            <div className="flex-col" style={{ gap: '5px' }}>
              <label className="station-label">{t('letter.gen_date')}</label>
              <div className="flex-row" style={{ gap: '5px' }}>
                <input className="station-input" value={options.fechaGeneracion} onChange={(e) => setOptions({...options, fechaGeneracion: e.target.value})} />
                <button className="station-btn" style={{ padding: '8px', boxShadow: 'none' }} onClick={() => handleToday('fechaGeneracion')}>T</button>
              </div>
            </div>
            <div className="flex-col" style={{ gap: '5px' }}>
              <label className="station-label">{t('letter.letter_date')}</label>
              <div className="flex-row" style={{ gap: '5px' }}>
                <input className="station-input" value={options.fechaCarta} onChange={(e) => setOptions({...options, fechaCarta: e.target.value})} />
                <button className="station-btn" style={{ padding: '8px', boxShadow: 'none' }} onClick={() => handleToday('fechaCarta')}>T</button>
              </div>
            </div>
          </div>

          <div className="grid-2" style={{ gap: '15px', marginTop: '10px' }}>
            <div className="flex-col" style={{ gap: '5px' }}>
              <label className="station-label">{t('letter.lote')}</label>
              <input className="station-input" value={options.lote} onChange={(e) => setOptions({...options, lote: e.target.value})} />
            </div>
            <div className="flex-col" style={{ gap: '5px' }}>
              <label className="station-label">{t('letter.office')}</label>
              <input className="station-input" value={options.oficina} onChange={(e) => setOptions({...options, oficina: e.target.value})} />
            </div>
          </div>
          <div className="flex-col" style={{ gap: '5px', marginTop: '10px' }}>
            <label className="station-label">{t('letter.doc_code')}</label>
            <input className="station-input" value={options.codDocumento} onChange={(e) => setOptions({...options, codDocumento: e.target.value})} />
          </div>
        </div>

        {/* Step 3 */}
        <div className="station-card">
          <div className="station-card-title">3. OUTPUT_STREAM</div>
          <div className="grid-2" style={{ gap: '15px' }}>
            <div className="flex-col" style={{ gap: '5px' }}>
              <label className="station-label">{t('letter.range_from')}</label>
              <input type="number" className="station-input" value={options.rangeFrom} onChange={(e) => setOptions({...options, rangeFrom: Number(e.target.value)})} />
            </div>
            <div className="flex-col" style={{ gap: '5px' }}>
              <label className="station-label">{t('letter.range_to')}</label>
              <input type="number" className="station-input" value={options.rangeTo} onChange={(e) => setOptions({...options, rangeTo: Number(e.target.value)})} />
            </div>
          </div>
          <div className="flex-col" style={{ gap: '5px', marginTop: '10px' }}>
            <label className="station-label">{t('letter.output_type')}</label>
            <select className="station-select" value={options.outputType} onChange={(e) => setOptions({...options, outputType: e.target.value as any})}>
              <option value="PDF_GAWEB">GAWEB_PACKAGE (.ZIP)</option>
              <option value="PDF">RAW_PDF_STREAM</option>
            </select>
          </div>
          <div className="flex-col" style={{ gap: '5px', marginTop: '10px' }}>
            <label className="station-label">{t('letter.output_dir')}</label>
            <div className="flex-row" style={{ gap: '5px' }}>
              <div className="station-input" style={{ fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {outputHandle ? outputHandle.name : 'TARGET_DIR_UNSET'}
              </div>
              <button className="station-btn" style={{ padding: '8px 15px', boxShadow: 'none' }} onClick={handlePickOutput}>...</button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-row" style={{ gap: '15px' }}>
        <button className="station-btn" style={{ flex: 1, padding: '15px' }} onClick={onOpenMapping}>
          <EyeIcon size={20} /> [MAP_FIELDS_MATRIX]
        </button>
        <button 
          className="station-btn station-btn-primary" 
          style={{ flex: 2, padding: '15px', fontSize: '1.2rem' }}
          disabled={!dataFile || !outputHandle || isProcessing}
          onClick={startGeneration}
        >
           {isProcessing ? 'GENERATING_PACKAGE...' : t('letter.btn_start')}
        </button>
        <button className="station-btn" style={{ flex: 1, padding: '15px', color: 'var(--accent-color)' }} disabled={!isProcessing}>
          [TERMINATE]
        </button>
      </div>

      <div style={{ minHeight: '300px', display: 'flex' }}>
        <LogConsole logs={logs} onClear={() => setLogs([])} onSave={() => {}} />
      </div>

      {showDataPreview && dataFile && <DataPreviewModal file={dataFile} onClose={() => setShowDataPreview(false)} />}

      {showTagsPreview && selectedTemplateId && (
        <div className="station-modal-overlay" onClick={() => setShowTagsPreview(false)}>
          <div className="station-modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
             <div className="station-card-title">DETECTED_TOKENS</div>
             <div className="flex-col" style={{ padding: '10px' }}>
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                   {templates.find(t => t.id === selectedTemplateId)?.content
                     .match(/\{\{(.*?)\}\}/g)?.map(tag => (
                       <li key={tag} style={{ color: 'var(--secondary-color)', fontWeight: 800 }}>
                         {tag}
                       </li>
                     )) || <li>NO_TOKENS_IDENTIFIED</li>}
                </ul>
             </div>
             <button className="station-btn" onClick={() => setShowTagsPreview(false)}>CLOSE</button>
          </div>
        </div>
      )}

      {showPresetEditor && <PresetEditorModal preset={editorPreset} onSave={handleSavePreset} onClose={() => setShowPresetEditor(false)} />}
      {showPreferences && <PreferencesModal settings={settings} onSave={handleSaveSettings} onClose={() => setShowPreferences(false)} />}
    </div>
  );
};

export default LetterStation;
