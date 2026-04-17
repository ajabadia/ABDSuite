'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/db';
import { 
  LetterTemplate, 
  LetterGenerationOptions 
} from '@/lib/types/letter.types';
import { 
  PlayIcon, 
  FolderIcon, 
  TagIcon,
  ZapIcon,
  DownloadIcon,
  SearchIcon,
  FileTextIcon
} from '@/components/common/Icons';
import { seedStressEnvironment, generateIndustrialStressData } from '@/lib/utils/stress-test-tool';
import JSZip from 'jszip';

import { useLog } from '@/lib/context/LogContext';
import { LogLevel } from '@/lib/types/log.types';

const LetterStation: React.FC = () => {
  const { t } = useLanguage();
  const { addLog: globalAddLog } = useLog();
  const router = useRouter();
  
  // Resources
  const presets = useLiveQuery(() => db.presets.toArray()) || [];
  const templates = useLiveQuery(() => db.letter_templates.toArray()) || [];
  const mappings = useLiveQuery(() => db.letter_mappings.toArray()) || [];

  // Selections
  const [selectedPresetId, setSelectedPresetId] = useState<number | null>(null);
  const [selectedMapping, setSelectedMapping] = useState<any>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [dataFile, setDataFile] = useState<File | null>(null);
  const [outputHandle, setOutputHandle] = useState<any>(null);
  const outputHandleRef = useRef<any>(null);
  
  // Sincronizar Ref para el manejador del Worker (Evita Stale Closure)
  useEffect(() => {
    outputHandleRef.current = outputHandle;
  }, [outputHandle]);
  
  // Lote Options
  const [options, setOptions] = useState<LetterGenerationOptions>({
    lote: '0013',
    oficina: '00000',
    codDocumento: 'x00054',
    fechaGeneracion: new Date().toISOString().split('T')[0].replace(/-/g, ''),
    fechaCarta: '20251218',
    rangeFrom: 0,
    rangeTo: 0,
    outputType: 'PDF_GAWEB'
  });

  // Engine
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingDownload, setPendingDownload] = useState<{blob: Blob, name: string} | null>(null);

  // El Downloader Industrial (Diálogos de Sistema Nativo)
  const triggerDownload = async (blob: Blob, name: string) => {
    addLog(`PREPARANDO DIÁLOGO DE SISTEMA PARA: ${name}...`);
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: name,
        types: [{
          description: 'ZIP Industrial Package',
          accept: { 'application/zip': ['.zip'] },
        }],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      addLog('ARCHIVO GUARDADO CORRECTAMENTE MEDIANTE DIÁLOGO DE SISTEMA.', 'info');
      setPendingDownload(null);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        addLog('GUARDADO CANCELADO POR EL USUARIO.', 'info');
      } else {
        addLog(`ERROR EN DIÁLOGO NATIVO: ${err.message}. Intentando fallback...`, 'error');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.click();
        URL.revokeObjectURL(url);
      }
    }
  };

  const workerRef = useRef<Worker | null>(null);

  const addLog = (message: string, type: 'info' | 'error' | 'warning' | 'debug' = 'info') => {
    globalAddLog('LETTER', message, type as LogLevel);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      workerRef.current = new Worker(new URL('../../lib/workers/document-engine.worker.ts', import.meta.url));
      workerRef.current.onmessage = async (e) => {
        const { type, payload } = e.data;
        if (type === 'HEARTBEAT') {
          (window as any).__WORKER_ALIVE = true;
          addLog(t('letter.motor.heartbeat'), 'info');
        }
        if (type === 'LOG') {
          addLog(payload.message, payload.type);
          if (payload.type === 'error') setIsProcessing(false);
        }
        if (type === 'COMPLETE') {
          setIsProcessing(false);
          addLog(t('letter.motor.gen_success'), 'info');
          if (payload?.blob) {
            setPendingDownload({ blob: payload.blob, name: payload.name });
            addLog(t('letter.motor.file_ready'), 'info');
          }
        }
        if (type === 'DOCUMENT_READY' && outputHandleRef.current) {
          try {
            const fileHandle = await (outputHandleRef.current as any).getFileHandle(payload.name, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(payload.content);
            await writable.close();
            addLog(t('letter.motor.physical_save', { file: payload.name }), 'info');
          } catch (err: any) {
            addLog(t('letter.motor.write_error', { file: payload.name, err: err.message }), 'error');
            addLog(t('letter.motor.write_suggest'), 'warning');
          }
        }
      };
    }
    return () => workerRef.current?.terminate();
  }, [options.lote]);

  // Handlers
  const handleTemplateUpload = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const newTemplate: LetterTemplate = {
        name: file.name,
        type: file.name.toLowerCase().endsWith('.docx') ? 'DOCX' : 'HTML',
        binaryContent: buffer,
        updatedAt: Date.now()
      };
      const id = await db.letter_templates.add(newTemplate);
      setSelectedTemplateId(id as number);
      addLog(`PLANTILLA DOCX CARGADA: ${file.name}`);
    } catch (err) { addLog(`ERROR_UPLOAD: ${err}`, 'error'); }
  };

  const handleShowTags = async () => {
    const injected = (window as any).__STRESS_RESOURCES || {};
    const template = injected.template || templates.find(t => t.id === selectedTemplateId);
    if (!template) { alert('Seleccione plantilla.'); return; }
    let tags: string[] = [];
    if (template.type === 'DOCX' && template.binaryContent) {
      const zip = await JSZip.loadAsync(template.binaryContent);
      const docXml = await zip.file('word/document.xml')?.async('text');
      if (docXml) {
        const regex = /\{\{(.*?)\}\}/g;
        let match;
        while ((match = regex.exec(docXml)) !== null) {
          tags.push(match[1].trim().replace(/<[^>]*>?/gm, ''));
        }
      }
    } else if (template.type === 'HTML' && template.content) {
      const regex = /\{\{(.*?)\}\}/g;
      let match;
      while ((match = regex.exec(template.content)) !== null) {
        tags.push(match[1].trim());
      }
    }
    const tagList = Array.from(new Set(tags));
    if (tagList.length > 0) {
      addLog('------------------------------------------------', 'info');
      addLog(`ETIQUETAS DETECTADAS EN PLANTILLA (${tagList.length}):`, 'info');
      tagList.forEach(t => addLog(` • {{ ${t} }}`, 'info'));
      addLog('------------------------------------------------', 'info');
    } else {
      addLog('ATENCIÓN: No se han identificado etiquetas dinámicas en esta plantilla.', 'error');
    }
  };

  const isValidIndustrialDate = (dateStr: string) => {
    if (!/^\d{8}$/.test(dateStr)) return false;
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1;
    const day = parseInt(dateStr.substring(6, 8));
    const date = new Date(year, month, day);
    return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day;
  };

  const handlePickOutput = async () => {
    try {
      const handle = await (window as any).showDirectoryPicker();
      const options = { mode: 'readwrite' };
      if (await (handle as any).requestPermission(options) === 'granted') {
         setOutputHandle(handle);
         addLog(`CARPETA VINCULADA: ${handle.name} (Escritura Concedida)`);
      } else {
         addLog('ATENCIÓN: Se denegaron los permisos de escritura.', 'error');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') addLog(`ERROR DIRECTORIO: ${err.message}`, 'error');
    }
  };

  const handleAutoMap = async () => {
    if (!selectedMapping || !selectedPresetId) return;
    try {
      const preset = await db.presets.get(selectedPresetId);
      const mapping = await db.letter_mappings.get(selectedMapping.id!);
      if (!preset || !mapping) return;
      const dataRecordType = preset.recordTypes.find(rt => rt.name === 'DATA');
      if (!dataRecordType) return;
      const newMappings = mapping.mappings.map(m => {
        const field = dataRecordType.fields.find(f => {
          const fName = (f.name || "").toLowerCase().replace(/_/g, '');
          const tVar = m.templateVar.toLowerCase().replace(/_/g, '');
          return fName === tVar || fName.includes(tVar.substring(0, 4));
        });
        const finalFieldName = field ? (field.name) : m.sourceField;
        return { ...m, sourceField: finalFieldName };
      });
      await db.letter_mappings.update(mapping.id!, { mappings: newMappings });
      addLog('AUTO-MAPEO: Sincronización inteligente completada.', 'info');
      const updated = await db.letter_mappings.get(mapping.id!);
      if (updated) setSelectedMapping(updated);
    } catch (err) { addLog(`ERROR AUTO-MAPEO: ${err}`, 'error'); }
  };

  const handleRunStressTest = async () => {
    setIsProcessing(true);
    addLog('INICIANDO DIAGNÓSTICO DE ESTRÉS (Volumen Reducido: 5)...', 'info');
    try {
      const { presetId, templateId, mapping, template, preset } = await seedStressEnvironment();
      setDataFile(generateIndustrialStressData(5));
      setSelectedPresetId(presetId);
      setSelectedTemplateId(templateId);
      setSelectedMapping(mapping);
      (window as any).__STRESS_RESOURCES = { mapping, template, preset };
      addLog(`RECURSOS INDUSTRIALES SINCRONIZADOS (5 REGISTROS).`);
      addLog('ENTORNO CONFIGURADO TOTALMENTE. PULSE INICIAR MOTOR.');
      setOptions(prev => ({ ...prev, lote: 'STRS' }));
    } catch (err) { addLog(`ERROR EN DIAGNÓSTICO: ${err}`, 'error'); setIsProcessing(false); }
  };

  const handleStart = async () => {
    if (!dataFile) { addLog('DIAGNOSTICO: Falta archivo de datos.', 'error'); return; }
    if (!selectedTemplateId) { addLog('DIAGNOSTICO: Falta plantilla.', 'error'); return; }
    if (!isValidIndustrialDate(options.fechaCarta) || !isValidIndustrialDate(options.fechaGeneracion)) {
       addLog('ERROR: Fechas no válidas (AAAAMMDD).', 'error'); return;
    }
    if (!selectedPresetId) { addLog('DIAGNOSTICO: Falta preset.', 'error'); return; }
    setIsProcessing(true);
    setPendingDownload(null);
    try {
      const injected = (window as any).__STRESS_RESOURCES || {};
      const template = injected.template || await db.letter_templates.get(selectedTemplateId);
      const preset = injected.preset || await db.presets.get(selectedPresetId);
      const mapping = injected.mapping || await db.letter_mappings.where('id').equals(selectedMapping?.id || 0).first();
      if (!template || !preset || !mapping) throw new Error('Faltan recursos (Plantilla/Preset/Mapeo).');
      addLog(t('processor.processing', { lote: options.lote }));
      (window as any).__WORKER_ALIVE = false;
      setTimeout(() => { if (!(window as any).__WORKER_ALIVE && isProcessing) { setIsProcessing(false); addLog(t('letter.motor.critical_paralysis'), 'error'); } }, 4000);
      
      // Inyección de Estándar Universal
      const { GAWEB_FIELDS } = await import('@/lib/logic/gaweb-auditor.logic');

      // Solo hacemos streaming si NO es modo ZIP y tenemos carpeta
      const shouldStream = options.outputType !== 'ZIP' && !!outputHandle;

      workerRef.current?.postMessage({ 
        dataFile, 
        template, 
        mapping, 
        etlPreset: preset, 
        options, 
        isStreaming: shouldStream,
        gawebFields: GAWEB_FIELDS // Inyección de reglas
      });
    } catch (err: any) { addLog(`ERROR ARRANQUE: ${err.message}`, 'error'); setIsProcessing(false); }
  };

    const isBox1Complete = !!selectedPresetId && !!dataFile && !!selectedTemplateId && !!selectedMapping;
    const isBox2Complete = !!options.lote && !!options.codDocumento && !!options.oficina && !!options.fechaCarta && !!options.fechaGeneracion;
    const isReadyForStart = isBox1Complete && isBox2Complete && (options.outputType === 'ZIP' || !!outputHandle);

    return (
      <div className="flex-col" style={{ gap: '24px', padding: '24px' }}>
        <section className="station-card flex-col" style={{ gap: '20px' }}>
          <span className="station-form-section-title">{t('letter.ui.resources').toUpperCase()}</span>
          <div className="station-form-grid">
            {/* Campo 1: Preset (Siempre Visible) */}
            <div className="station-form-field large">
              <label className="station-label">{t('letter.ui.presets')}</label>
              <div className="flex-row" style={{ gap: '8px' }}>
                <select className="station-select" style={{ flex: 1 }} value={selectedPresetId || ''} onChange={e => setSelectedPresetId(Number(e.target.value))}>
                  <option value="">{t('letter.ui.select_preset')}</option>
                  {presets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <button className="station-btn" onClick={() => router.push('/letter?view=config')}>{t('letter.ui.edit').toUpperCase()}</button>
              </div>
            </div>
  
            {/* Campo 2: DataFile (Depende de Preset) */}
            {selectedPresetId && (
              <div className="flex-row fade-in" style={{ width: '100%', gridColumn: '1 / -1' }}>
                <div className="station-form-field" style={{ flex: 1 }}>
                  <label className="station-label">{t('letter.ui.data_file')}</label>
                  <div className="flex-row" style={{ gap: '8px' }}>
                    <input className="station-input" style={{ flex: 1 }} readOnly value={dataFile?.name || ''} placeholder={t('letter.ui.waiting_data')} />
                    <label className="station-btn">{t('letter.ui.explore').toUpperCase()}<input type="file" hidden onChange={e => setDataFile(e.target.files?.[0] || null)} /></label>
                  </div>
                </div>
              </div>
            )}
  
            {/* Campo 3: Template (Depende de DataFile) */}
            {dataFile && (
              <div className="flex-row fade-in" style={{ width: '100%', gridColumn: '1 / -1' }}>
                <div className="station-form-field" style={{ flex: 1 }}>
                  <label className="station-label">{t('letter.ui.template_visual')}</label>
                  <div className="flex-row" style={{ gap: '8px' }}>
                    <select className="station-select" style={{ flex: 1 }} value={selectedTemplateId || ''} onChange={e => setSelectedTemplateId(Number(e.target.value))}>
                      <option value="">{t('letter.ui.select_template')}</option>
                      {templates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.type})</option>)}
                    </select>
                    <button className="station-btn" onClick={() => (document.getElementById('tpl-upload') as any).click()}>{t('letter.ui.upload').toUpperCase()}</button>
                    <button className="station-btn icon-only" onClick={handleShowTags}><SearchIcon size={14} /></button>
                    <input id="tpl-upload" type="file" hidden onChange={e => { if(e.target.files) handleTemplateUpload(e.target.files[0]) }} />
                  </div>
                </div>
              </div>
            )}
  
            {/* Campo 4: Mapping (Depende de Template) */}
            {selectedTemplateId && (
              <div className="flex-row fade-in" style={{ width: '100%', gridColumn: '1 / -1' }}>
                <div className="station-form-field" style={{ flex: 1 }}>
                  <label className="station-label">{t('letter.ui.mapping_brain')}</label>
                  <div className="flex-row" style={{ gap: '8px' }}>
                    <select className="station-select" style={{ flex: 1 }} value={selectedMapping?.id || ''} onChange={e => setSelectedMapping(mappings.find(m => m.id === Number(e.target.value)) || null)}>
                      <option value="">{t('letter.ui.select_mapping')}</option>
                      {mappings.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                    <button className="station-btn" onClick={handleAutoMap}>{t('letter.ui.auto_map').toUpperCase()}</button>
                  </div>
                  {selectedMapping && (
                     <div className="flex-col fade-in" style={{ marginTop: '12px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: '8px', display: 'block', textTransform: 'uppercase' }}>{t('letter.ui.data_health')}</span>
                        <div className="flex-row" style={{ flexWrap: 'wrap', gap: '8px' }}>
                           {selectedMapping.mappings.map((m: any, i: number) => {
                              const isMapped = !!m.sourceField;
                              return (
                                 <div key={i} style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '9px', background: isMapped ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', border: `1px solid ${isMapped ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`, color: isMapped ? '#4ade80' : '#f87171', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {isMapped ? '✓' : '⚠'} {m.templateVar} {isMapped && <span style={{ opacity: 0.5 }}>→ {m.sourceField}</span>}
                                 </div>
                              );
                           })}
                        </div>
                     </div>
                  )}
                </div>
              </div>
            )}
  
            {/* Campo 5: Folder (Depende de Mapping) */}
            {selectedMapping && (
              <div className="flex-row fade-in" style={{ width: '100%', gridColumn: '1 / -1' }}>
                <div className="station-form-field" style={{ flex: 1 }}>
                  <div className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                     <label className="station-label" style={{ marginBottom: 0 }}>{t('letter.ui.folder_output')}</label>
                     {outputHandle && (
                        <div className="flex-row fade-in" style={{ gap: '6px', padding: '2px 8px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '12px', border: '1px solid var(--status-ok)' }}>
                           <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--status-ok)', animation: 'pulse 2s infinite' }} />
                           <span style={{ fontSize: '10px', color: 'var(--status-ok)', fontWeight: 700, textTransform: 'uppercase' }}>{t('letter.ui.write_granted')}</span>
                        </div>
                     )}
                  </div>
                  <div className="flex-row" style={{ gap: '8px' }}>
                    <div className="station-input" style={{ flex: 1, color: outputHandle ? 'var(--status-ok)' : 'rgba(255,255,255,0.2)', fontSize: '0.9rem', display: 'flex', alignItems: 'center' }}>
                       {outputHandle?.name ? t('letter.ui.system_disk', { name: outputHandle.name }) : t('letter.ui.enable_write')}
                    </div>
                    <button className="station-btn" onClick={handlePickOutput}><FolderIcon size={14} /> {t('letter.ui.grant_access').toUpperCase()}</button>
                    {outputHandle && <button className="station-btn err" onClick={() => setOutputHandle(null)}>X</button>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
  
        {!isBox1Complete && (
          <div className="station-empty-state">
            <FileTextIcon size={64} style={{ marginBottom: '16px' }} />
            <span className="station-shimmer-text">GENERATION_CORE_ONLINE</span>
          </div>
        )}
  
        {/* PARÁMETROS DEL LOTE (Solo si Box 1 está completo) */}
        {isBox1Complete && (
          <section className="station-card flex-col fade-in" style={{ gap: '20px' }}>
            <span className="station-form-section-title">{t('letter.ui.batch_params').toUpperCase()}</span>
            <div className="station-form-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr) !important', display: 'grid !important', gap: '20px' }}>
              <div className="station-form-field"><label className="station-label">{t('letter.ui.letter_date')}</label><div className="flex-row" style={{ gap: 4 }}><input className="station-input" style={{ flex: 1 }} value={options.fechaCarta} onChange={e => setOptions({...options, fechaCarta: e.target.value})} maxLength={8} /><button className="station-btn" onClick={() => setOptions({...options, fechaCarta: new Date().toISOString().split('T')[0].replace(/-/g, '')})}>{t('letter.ui.today')}</button></div></div>
              <div className="station-form-field"><label className="station-label">{t('letter.ui.gen_date')}</label><div className="flex-row" style={{ gap: 4 }}><input className="station-input" style={{ flex: 1 }} value={options.fechaGeneracion} onChange={e => setOptions({...options, fechaGeneracion: e.target.value})} maxLength={8} /><button className="station-btn" onClick={() => setOptions({...options, fechaGeneracion: new Date().toISOString().split('T')[0].replace(/-/g, '')})}>{t('letter.ui.today')}</button></div></div>
              <div className="station-form-field"><label className="station-label">{t('letter.ui.lote_id')}</label><input className="station-input" style={{ textAlign: 'center' }} value={options.lote} onChange={e => setOptions({...options, lote: e.target.value})} maxLength={4} /></div>
              <div className="station-form-field"><label className="station-label">{t('letter.ui.doc_code')}</label><input className="station-input" value={options.codDocumento} onChange={e => setOptions({...options, codDocumento: e.target.value})} /></div>
              <div className="station-form-field"><label className="station-label">{t('letter.ui.office')}</label><input className="station-input" style={{ textAlign: 'center' }} value={options.oficina} onChange={e => setOptions({...options, oficina: e.target.value})} /></div>
              <div className="station-form-field"><label className="station-label">{t('letter.ui.range')}</label><div className="flex-row" style={{ gap: 8 }}><input className="station-input" style={{ width: '50%', textAlign: 'center' }} type="number" value={options.rangeFrom} onChange={e => setOptions({...options, rangeFrom: Number(e.target.value)})} /><input className="station-input" style={{ width: '50%', textAlign: 'center' }} type="number" value={options.rangeTo} onChange={e => setOptions({...options, rangeTo: Number(e.target.value)})} /></div></div>
              <div className="station-form-field"><label className="station-label">{t('letter.ui.output_format')}</label><select className="station-select" style={{ width: '100%' }} value={options.outputType} onChange={e => setOptions({...options, outputType: e.target.value as any})}><option value="PDF_GAWEB">GAWEB (MASTER)</option><option value="ZIP">ZIP (AUDIT)</option></select></div>
            </div>
          </section>
        )}
  
        {/* ACCIÓN FINAL (Solo si TODO está relleno y listo) */}
        {isReadyForStart && (
          <div className="flex-row fade-in" style={{ justifyContent: 'flex-end' }}>
            <button className="station-btn station-btn-primary" disabled={isProcessing} style={{ width: '400px', height: '64px', fontSize: '1.4rem', fontWeight: 900 }} onClick={handleStart}><PlayIcon size={28} /> {isProcessing ? t('common.processing').toUpperCase() : t('letter.ui.btn_generate').toUpperCase()}</button>
          </div>
        )}
  
        {pendingDownload && (
          <div className="station-card flex-col" style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid var(--status-ok)', gap: '12px' }}>
            <span style={{ color: 'var(--status-ok)', fontWeight: 700, textAlign: 'center' }}>{t('letter.ui.gen_success_inline').toUpperCase()}</span>
            <button className="station-btn station-btn-primary" style={{ background: 'var(--status-ok)', color: 'white', height: '50px' }} onClick={() => triggerDownload(pendingDownload.blob, pendingDownload.name)}><DownloadIcon size={20} /> {t('letter.ui.download_full').toUpperCase()}</button>
          </div>
        )}
  
        {isBox1Complete && (
          <div className="station-card fade-in" style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px dashed rgba(239, 68, 68, 0.2)', marginTop: '24px' }}>
            <button className="station-btn" style={{ width: '100%', height: '40px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--status-err)', fontWeight: 800 }} onClick={handleRunStressTest} disabled={isProcessing}><ZapIcon size={14} /> {t('letter.ui.stress_test_btn').toUpperCase()}</button>
          </div>
        )}

        {/* Sello de Integridad (Era 5) */}
        <div className="station-integrity-badge" style={{ position: 'fixed', bottom: '24px', right: '24px' }}>
           <div className="integrity-dot" />
           <FileTextIcon size={14} />
           <span>ESTÁNDAR GAWEB v.1</span>
        </div>
      </div>
    );
  };
  
  export default LetterStation;
