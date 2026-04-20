'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useConfig } from '@/lib/context/ConfigContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/db';
import { 
  LetterTemplate, 
  LetterGenerationOptions 
} from '@/lib/types/letter.types';
import { 
  WorkerEvent,
  LetterWorkerPayload
} from '@/lib/types/worker.contracts';
import { normalizeLetterOptions } from '@/lib/utils/letter-normalization';
import { 
  PlayIcon, 
  FolderIcon, 
  TagIcon,
  ZapIcon,
  DownloadIcon,
  SearchIcon,
  FileTextIcon,
  CogIcon,
  ListIcon,
  MapIcon
} from '@/components/common/Icons';
import { seedStressEnvironment, generateIndustrialStressData } from '@/lib/utils/stress-test-tool';
import JSZip from 'jszip';
import { useTelemetryConfig } from '@/lib/context/TelemetryContext';
import { useIsNarrowLayout } from '@/lib/hooks/useIsNarrowLayout';
import { TelemetryConfigService } from '@/lib/services/telemetry-config.service';
import { clsx } from '@/lib/utils/clsx';

import { RendererHost } from '@/components/common/RendererHost';

import { useLog } from '@/lib/context/LogContext';
import { LogLevel } from '@/lib/types/log.types';
import { useWorkspace } from '@/lib/context/WorkspaceContext';
import { auditService } from '@/lib/services/AuditService';

const LetterStation: React.FC = () => {
  const { t } = useLanguage();
  const { environment, isTechnicianMode } = useConfig();
  const { can, currentOperator } = useWorkspace();
  const { addLog: globalAddLog } = useLog();
  const { config: telemetryConfig } = useTelemetryConfig();
  const router = useRouter();
  
  const canGenerate = can('LETTER_GENERATE');
  const canDiag = can('SETTINGS_GLOBAL') || isTechnicianMode;
  
  // Resources
  const presets = useLiveQuery(() => db.presets_v6.toArray()) || [];
  const templates = useLiveQuery(() => db.lettertemplates_v6.toArray()) || [];
  const mappings = useLiveQuery(() => db.lettermappings_v6.toArray()) || [];

  // Selections
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [selectedMapping, setSelectedMapping] = useState<any>(null); 
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [dataFile, setDataFile] = useState<File | null>(null);
  const [outputHandle, setOutputHandle] = useState<FileSystemHandle | null>(null);
  const outputHandleRef = useRef<FileSystemHandle | null>(null);
  const [rendererEngine, setRendererEngine] = useState<{
    renderToPdf: (b: Blob, n: string) => Promise<Blob>,
    captureFingerprint: (b: Blob, n: string) => Promise<string>
  } | null>(null);
  const writeQueue = useRef<Promise<void>>(Promise.resolve());

  
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
  
  // QA & Lab Mode
  const [isLabMode, setIsLabMode] = useState(false);
  const [qaStatus, setQaStatus] = useState<'PENDING' | 'MATCH' | 'BREAK' | 'NO_GOLDEN'>('PENDING');

  // --- WIZARD STATE (Phase 15) ---
  type WizardStepId = 'DATA' | 'DESIGN' | 'LOGIC' | 'DESTINATION' | 'EXECUTION';
  const [currentStepId, setCurrentStepId] = useState<WizardStepId>('DATA');
  const isNarrow = useIsNarrowLayout();
  const wizardEnabled = telemetryConfig?.security.uiFeatures.letterWizardEnabled ?? true;

  const isValidIndustrialDate = (dateStr: string) => {
    if (!/^\d{8}$/.test(dateStr)) return false;
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1;
    const day = parseInt(dateStr.substring(6, 8));
    const date = new Date(year, month, day);
    return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day;
  };

  const steps = useMemo(() => {
    const step1Complete = !!selectedPresetId && !!dataFile;
    const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
    const step2Complete = !!selectedTemplate && selectedTemplate.isActive !== false;
    const step3Complete = !!selectedMapping;
    const step4Complete = !!outputHandle;
    const step5Complete = !!options.lote && !!options.codDocumento && options.codDocumento.length === 6 && !!options.oficina && options.oficina.length === 5 && isValidIndustrialDate(options.fechaCarta) && isValidIndustrialDate(options.fechaGeneracion);

    return [
      { id: 'DATA', label: t('letter.wizard.data') || 'DATOS', complete: step1Complete, error: step1Complete ? undefined : 'Selecciona un preset y carga el fichero GAWEB.' },
      { id: 'DESIGN', label: t('letter.wizard.design') || 'DISEÑO', complete: step2Complete, error: step2Complete ? undefined : 'Selecciona una plantilla activa.' },
      { id: 'LOGIC', label: t('letter.wizard.logic') || 'MAPEO', complete: step3Complete, error: step3Complete ? undefined : 'Asigna un Mapping Brain al lote.' },
      { id: 'DESTINATION', label: t('letter.wizard.dest') || 'DESTINO', complete: step4Complete, error: step4Complete ? undefined : 'Selecciona una carpeta de salida.' },
      { id: 'EXECUTION', label: t('letter.wizard.run') || 'EJECUCIÓN', complete: step5Complete, error: step5Complete ? undefined : 'Completa los campos obligatorios del lote.' }
    ] as const;
  }, [selectedPresetId, dataFile, selectedTemplateId, templates, selectedMapping, outputHandle, options, t]);

  const canStartEngine = steps.every(s => s.complete);

  // Golden Reference Link
  const goldenRef = useLiveQuery(async () => {
    if (!selectedTemplateId || !selectedMapping?.id || !selectedPresetId) return null;
    return await db.golden_tests_v6
      .where({ 
        templateId: selectedTemplateId, 
        mappingId: selectedMapping.id, 
        etlPresetId: selectedPresetId,
        codDocumento: options.codDocumento
      })
      .first();
  }, [selectedTemplateId, selectedMapping?.id, selectedPresetId, options.codDocumento]);

  const addLog = (message: string, type: 'info' | 'error' | 'warning' | 'debug' = 'info') => {
    globalAddLog('LETTER', message, type as LogLevel);
  };

  // Handlers
  const triggerDownload = async (blob: Blob, name: string) => {
    addLog(t('letter.motor.prep_save', { file: name }));
    try {
      const isZip = name.toLowerCase().endsWith('.zip');
      const isPdf = name.toLowerCase().endsWith('.pdf');
      const isTxt = name.toLowerCase().endsWith('.txt');
      
      const fileTypes = [];
      if (isPdf) fileTypes.push({ description: 'Documento PDF', accept: { 'application/pdf': ['.pdf'] } });
      else if (isZip) fileTypes.push({ description: 'Paquete ZIP Industrial', accept: { 'application/zip': ['.zip'] } });
      else if (isTxt) fileTypes.push({ description: 'Archivo de Texto/GAWEB', accept: { 'text/plain': ['.txt'] } });

      const handle = await (window as any).showSaveFilePicker({
        suggestedName: name,
        types: fileTypes.length > 0 ? fileTypes : undefined,
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      addLog(t('letter.motor.save_success'), 'info');
      setPendingDownload(null);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        addLog(t('letter.motor.save_cancel'), 'info');
      } else {
        addLog(t('letter.motor.save_error', { err: err.message }), 'error');
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      workerRef.current = new Worker(new URL('../../lib/workers/document-engine.worker.ts', import.meta.url));
      workerRef.current.onmessage = async (e: MessageEvent<WorkerEvent>) => {
        const { type, payload } = e.data;
        if (type === 'HEARTBEAT') {
          (window as any).__WORKER_ALIVE = true;
          addLog(t('letter.motor.heartbeat'), 'info');
        }
        if (type === 'LOG' && payload) {
          addLog(payload.message || '', payload.type);
          if (payload.type === 'error') setIsProcessing(false);
        }
        if (type === 'COMPLETE' && payload) {
          setIsProcessing(false);
          addLog(t('letter.motor.gen_success'), 'info');
          if (payload.blob) {
            setPendingDownload({ blob: payload.blob, name: payload.name || 'document.zip' });
            addLog(t('letter.motor.file_ready'), 'info');

            await auditService.log({
              module: 'LETTER',
              messageKey: 'letter.batch.run',
              status: 'SUCCESS',
              operatorId: currentOperator?.id,
              details: {
                eventType: 'LETTER_BATCH_RUN',
                entityType: 'LETTER_BATCH',
                entityId: `batch_${Date.now()}`,
                actorId: currentOperator?.id,
                actorUser: currentOperator?.username,
                severity: 'INFO',
                context: {
                  presetName: presets.find(p => p.id === selectedPresetId)?.name || 'N/A',
                  templateName: templates.find(t => t.id === selectedTemplateId)?.name || 'N/A',
                  totalDocs: 0,
                  outputType: options.outputType
                }
              }
            });
          }
        }
        if (type === 'DOCUMENT_READY' && payload && outputHandleRef.current) {
          writeQueue.current = writeQueue.current.then(async () => {
            try {
              let finalContent = payload.content as ArrayBuffer;
              let finalName = payload.name as string;

              if (options.outputType.startsWith('PDF') && (finalName.endsWith('.docx') || finalName.endsWith('.html')) && rendererEngine) {
                try {
                  const isDocx = finalName.endsWith('.docx');
                  const mimeType = isDocx ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'text/html';
                  const docBlob = new Blob([finalContent], { type: mimeType });
                  
                  addLog(t('letter.motor.converting_pdf', { file: finalName }), 'info');
                  const pdfBlob = await rendererEngine.renderToPdf(docBlob, finalName);
                  
                  if (payload.isFirst && goldenRef) {
                    addLog('AUTOMATED_QA: Verificando integridad visual...', 'warning');
                    const currentHash = await (rendererEngine as any).captureFingerprint(docBlob, finalName);
                    
                    const isMatch = currentHash === goldenRef.layoutHash;
                    const qaResult = isMatch ? 'MATCH' : 'BREAK';
                    
                    if (isMatch) {
                      addLog('🏆 QA_MATCH: Integridad visual confirmada.', 'info');
                      setQaStatus('MATCH');
                      await db.golden_tests_v6.update(goldenRef.id!, { lastVerifiedAt: Date.now() });
                    } else {
                      addLog('❌ QA_BREAK: Regresión de layout detectada.', 'error');
                    }

                    await auditService.log({
                      module: 'LETTER',
                      messageKey: 'letter.qa.batch',
                      status: isMatch ? 'SUCCESS' : 'WARNING',
                      operatorId: currentOperator?.id,
                      details: {
                        eventType: 'LETTER_QA_BATCH',
                        entityType: 'LETTER_QA',
                        entityId: options.lote,
                        actorId: currentOperator?.id,
                        actorUser: currentOperator?.username,
                        severity: isMatch ? 'INFO' : 'CRITICAL',
                        context: { lote: options.lote, codDocumento: options.codDocumento, qaStatus: qaResult }
                      }
                    });

                    if (!isMatch) {
                      setIsProcessing(false);
                      workerRef.current?.terminate();
                      addLog('LOTE DETENIDO POR SEGURIDAD INDUSTRIAL (QA_BREAK).', 'error');
                      return;
                    }
                  } else if (payload.isFirst) {
                    setQaStatus('NO_GOLDEN');
                  }

                  finalContent = await pdfBlob.arrayBuffer();
                  finalName = finalName.replace(/\.(docx|html)$/i, '.pdf');
                } catch (convErr) {
                  addLog(`ERROR CONVERSIÓN PDF: ${convErr}. SE MANTENDRÁ ORIGINAL.`, 'warning');
                }
              }

              const fileHandle = await (outputHandleRef.current as any).getFileHandle(finalName, { create: true });
              const writable = await fileHandle.createWritable();
              await writable.write(finalContent);
              await writable.close();
              addLog(t('letter.motor.physical_save', { file: finalName }), 'info');

            } catch (err: any) {
              addLog(t('letter.motor.write_error', { file: payload.name || 'document', err: err.message }), 'error');
            }
          });
        }
      };
    }
    return () => workerRef.current?.terminate();
  }, [options.lote, rendererEngine, options.outputType]);

  const handleTemplateUpload = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const newTemplate: LetterTemplate = {
        name: file.name,
        type: file.name.toLowerCase().endsWith('.docx') ? 'DOCX' : 'HTML',
        binaryContent: buffer,
        updatedAt: Date.now()
      };
      const id = await db.lettertemplates_v6.add(newTemplate);
      setSelectedTemplateId(id as string);
      addLog(`PLANTILLA DOCX CARGADA: ${file.name}`);
    } catch (err) { addLog(`ERROR_UPLOAD: ${err}`, 'error'); }
  };

  const handleShowTags = async () => {
    const template = templates.find(t => t.id === selectedTemplateId);
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
      tagList.forEach(tName => addLog(` • {{ ${tName} }}`, 'info'));
      addLog('------------------------------------------------', 'info');
    } else {
      addLog('ATENCIÓN: No se han identificado etiquetas dinámicas en esta plantilla.', 'error');
    }
  };

  const handlePickOutput = async () => {
    try {
      const handle = await (window as any).showDirectoryPicker();
      const pickOptions = { mode: 'readwrite' };
      if (await (handle as any).requestPermission(pickOptions) === 'granted') {
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
      const preset = await db.presets_v6.get(selectedPresetId);
      const mapping = await db.lettermappings_v6.get(selectedMapping.id!);
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
      await db.lettermappings_v6.update(mapping.id!, { mappings: newMappings });
      addLog('AUTO-MAPEO: Sincronización inteligente completada.', 'info');
      const updated = await db.lettermappings_v6.get(mapping.id!);
      if (updated) setSelectedMapping(updated);
    } catch (err) { addLog(`ERROR AUTO-MAPEO: ${err}`, 'error'); }
  };

  const handleRunStressTest = async (count: number = 5) => {
    setIsProcessing(true);
    addLog(`INICIANDO DIAGNÓSTICO DE ESTRÉS (Volumen: ${count})...`, 'info');
    try {
      const { presetId, templateId, mapping, template, preset } = await seedStressEnvironment();
      const stressFile = generateIndustrialStressData(count);
      setSelectedPresetId(presetId);
      setDataFile(stressFile);
      setSelectedTemplateId(templateId);
      setSelectedMapping(mapping);
      (window as any).__STRESS_RESOURCES = { mapping, template, preset };
      addLog(`RECURSOS INDUSTRIALES SINCRONIZADOS (${count} REGISTROS).`);
      setOptions(prev => ({ ...prev, lote: 'STRS', outputType: count > 10 ? 'PDF' : 'PDF_GAWEB' }));
    } catch (err) { 
      addLog(`ERROR EN DIAGNÓSTICO: ${err}`, 'error'); 
    } finally {
      setIsProcessing(false);
    }
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
      const template = injected.template || await db.lettertemplates_v6.get(selectedTemplateId);
      const preset = injected.preset || await db.presets_v6.get(selectedPresetId);
      const mapping = injected.mapping || await db.lettermappings_v6.where('id').equals(selectedMapping?.id || '').first();
      if (!template || !preset || !mapping) throw new Error('Faltan recursos (Plantilla/Preset/Mapeo).');
      addLog(t('processor.processing', { lote: options.lote }));
      (window as any).__WORKER_ALIVE = false;
      setTimeout(() => { if (!(window as any).__WORKER_ALIVE && isProcessing) { setIsProcessing(false); addLog(t('letter.motor.critical_paralysis'), 'error'); } }, 4000);
      const { GAWEB_FIELDS } = await import('@/lib/logic/gaweb-auditor.logic');
      const shouldStream = options.outputType !== 'ZIP' && !!outputHandle;
      const normalizedOptions = normalizeLetterOptions(options);

      const workerPayload: LetterWorkerPayload = { 
        dataFile, 
        template, 
        mapping, 
        etlPreset: preset, 
        options: normalizedOptions, 
        isStreaming: shouldStream,
        gawebFields: GAWEB_FIELDS 
      };

      workerRef.current?.postMessage(workerPayload);
    } catch (err: any) { 
      addLog(`ERROR ARRANQUE: ${err.message}`, 'error'); 
      setIsProcessing(false); 
    }
  };

  const renderWizardHeader = () => {
    return (
      <nav className="wizard-nav flex-row" style={{ gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
        {steps.map((s) => (
          <button
            key={s.id}
            className={clsx('wizard-step-btn', {
              active: currentStepId === s.id,
              complete: s.complete,
              error: currentStepId === s.id && !s.complete && s.error
            })}
            onClick={() => setCurrentStepId(s.id as WizardStepId)}
            style={{
              flex: 1,
              minWidth: '120px',
              padding: '12px',
              background: currentStepId === s.id ? 'var(--primary-color)' : 'rgba(255,255,255,0.03)',
              color: currentStepId === s.id ? 'white' : 'rgba(255,255,255,0.6)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s ease'
            }}
          >
            <span style={{ fontSize: '10px', fontWeight: 800, opacity: 0.5 }}>{s.id}</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
              {s.complete ? '✅ ' : ''}{s.label}
            </span>
          </button>
        ))}
      </nav>
    );
  };

  const renderStepContent = () => {
    switch (currentStepId) {
      case 'DATA':
        return (
          <div className="flex-col animate-fade-in" style={{ gap: '20px' }}>
             <div className="station-form-field">
                <label className="station-label">{t('letter.ui.presets')}</label>
                <select className="station-select" value={selectedPresetId || ''} onChange={e => setSelectedPresetId(e.target.value)}>
                  <option value="">{t('letter.ui.select_preset')}</option>
                  {presets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
             </div>
             {selectedPresetId && (
               <div className="station-form-field">
                  <label className="station-label">{t('letter.ui.data_file')}</label>
                  <div className="flex-row" style={{ gap: '12px' }}>
                     <button className="station-btn station-btn-primary" onClick={() => (document.getElementById('gaweb-upload') as any).click()}>
                        <FolderIcon size={16} /> {dataFile ? dataFile.name : t('letter.ui.btn_upload')}
                     </button>
                     <input id="gaweb-upload" type="file" hidden onChange={e => {
                        const f = e.target.files?.[0];
                        if (f) setDataFile(f);
                     }} />
                     {dataFile && <span className="station-badge success">READY</span>}
                  </div>
               </div>
             )}
          </div>
        );
      case 'DESIGN':
        return (
          <div className="flex-col animate-fade-in" style={{ gap: '20px' }}>
             <div className="station-form-field">
                <label className="station-label">{t('letter.ui.templates')}</label>
                <select className="station-select" value={selectedTemplateId || ''} onChange={e => setSelectedTemplateId(e.target.value)}>
                   <option value="">{t('letter.ui.select_template')}</option>
                   {templates.map(tmp => <option key={tmp.id} value={tmp.id}>{tmp.name}</option>)}
                </select>
             </div>
             <div className="flex-row" style={{ gap: '12px', marginTop: '12px' }}>
                <button className="station-btn" onClick={() => (document.getElementById('docx-upload') as any).click()}>
                   <TagIcon size={16} /> SUBIR DOCX
                </button>
                <input id="docx-upload" type="file" accept=".docx" hidden onChange={e => {
                   const f = e.target.files?.[0];
                   if (f) handleTemplateUpload(f);
                }} />
                {selectedTemplateId && (
                   <button className="station-btn icon-only" onClick={handleShowTags} title="Ver etiquetas">
                      <SearchIcon size={16} />
                   </button>
                )}
             </div>
          </div>
        );
      case 'LOGIC':
        return (
          <div className="flex-col animate-fade-in" style={{ gap: '20px' }}>
            <div className="station-form-field">
              <label className="station-label">{t('letter.ui.mapping_brain')}</label>
              <select className="station-select" value={selectedMapping?.id || ''} onChange={e => {
                const m = mappings.find(x => x.id === e.target.value);
                if (m) setSelectedMapping(m);
              }}>
                <option value="">-- SELECCIONAR MAPEADO --</option>
                {mappings.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            {selectedMapping && (
              <div className="alert-box success" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <MapIcon size={20} />
                <div className="flex-col">
                  <span style={{ fontWeight: 800 }}>BRAIN_ACTIVE: {selectedMapping.name}</span>
                  <span style={{ fontSize: '11px', opacity: 0.7 }}>Sincronizando variables con motor de renderizado...</span>
                </div>
              </div>
            )}
            <button className="station-btn" style={{ marginTop: '20px' }} onClick={() => router.push('/letter?view=mappings')}>
              GESTIONAR MAPEADOS
            </button>
          </div>
        );
      case 'DESTINATION':
        return (
          <div className="flex-col animate-fade-in" style={{ gap: '20px' }}>
             <div className="station-form-field">
                <label className="station-label">CARPETA DE SALIDA (NATIVO)</label>
                <div className="flex-row" style={{ gap: '12px' }}>
                   <button className="station-btn station-btn-primary" onClick={handlePickOutput}>
                      <FolderIcon size={16} /> {outputHandle ? `CONCEDIDO: ${outputHandle.name}` : 'SELECCIONAR CARPETA'}
                   </button>
                   {outputHandle && <span className="station-badge success">DIRECTORY_LINKED</span>}
                </div>
                <p style={{ fontSize: '11px', opacity: 0.5, marginTop: '8px' }}>
                   ERA 6 utiliza el File System Access API para escribir directamente en el disco duro industrial sin descargas manuales.
                </p>
             </div>
          </div>
        );
      case 'EXECUTION':
        return (
          <div className="flex-col animate-fade-in" style={{ gap: '20px' }}>
             <div className="station-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div className="station-form-field"><label className="station-label">LOTE</label><input className="station-input" value={options.lote} onChange={e => setOptions({...options, lote: e.target.value})} maxLength={4} /></div>
                <div className="station-form-field"><label className="station-label">COD_DOC</label><input className="station-input" value={options.codDocumento} onChange={e => setOptions({...options, codDocumento: e.target.value})} maxLength={6} /></div>
                <div className="station-form-field"><label className="station-label">OFICINA</label><input className="station-input" value={options.oficina} onChange={e => setOptions({...options, oficina: e.target.value})} maxLength={5} /></div>
                <div className="station-form-field"><label className="station-label">FECHA_CARTA</label><input className="station-input" value={options.fechaCarta} onChange={e => setOptions({...options, fechaCarta: e.target.value})} placeholder="AAAAMMDD" /></div>
             </div>

             <div className="pre-flight-checklist" style={{ padding: '20px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 900, marginBottom: '16px', opacity: 0.4 }}>PRE-FLIGHT CHECKLIST INDUSTRIAL</div>
                <div className="flex-col" style={{ gap: '8px' }}>
                  {steps.map(s => (
                    <div key={s.id} className="flex-row" style={{ justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ opacity: s.complete ? 1 : 0.4 }}>{s.label}</span>
                      <span style={{ fontWeight: 800, color: s.complete ? 'var(--status-ok)' : 'var(--status-err)' }}>
                        {s.complete ? 'READY' : (s.error || 'PENDING')}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                  <button 
                    className="station-btn station-btn-primary" 
                    disabled={!canStartEngine || isProcessing}
                    style={{ width: '100%', height: '60px', fontSize: '1.4rem', fontWeight: 900 }}
                    onClick={handleStart}
                  >
                    <ZapIcon size={24} /> INICIAR MOTOR
                  </button>
                </div>
             </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="flex-col" style={{ gap: '24px', padding: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {/* CABECERA INDUSTRIAL */}
      <header className="station-card flex-col" style={{ gap: '16px', borderBottom: '2px solid var(--border-color)', borderRadius: 0, paddingBottom: '24px' }}>
        <div className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div className="flex-col" style={{ gap: '4px' }}>
            <h2 className="station-title-main" style={{ margin: 0, fontSize: '1.5rem', letterSpacing: '0.1rem' }}>
              LETTER STATION {wizardEnabled ? '· WIZARD' : '· REGISTRY'}
            </h2>
            <div className="flex-row" style={{ gap: '8px' }}>
              <span className="station-badge">ERA 6</span>
              <span className="station-badge success">SYS_READY</span>
              {qaStatus !== 'PENDING' && (
                <span className={`station-badge ${qaStatus === 'MATCH' ? 'success' : 'err'}`}>
                  QA: {qaStatus}
                </span>
              )}
            </div>
          </div>
          <div className="flex-row" style={{ gap: '12px' }}>
            {goldenRef && (
              <div className="flex-col" style={{ alignItems: 'flex-end', gap: '2px' }}>
                 <span style={{ fontSize: '9px', fontWeight: 800, opacity: 0.5 }}>GOLDEN_MASTER v{goldenRef.version}</span>
                 <span style={{ fontSize: '8px', opacity: 0.4 }}>VISTO: {new Date(goldenRef.lastVerifiedAt || 0).toLocaleDateString()}</span>
              </div>
            )}
            <button className="station-btn icon-only" onClick={() => router.push('/letter?view=config')}><CogIcon size={18} /></button>
          </div>
        </div>
      </header>

      {wizardEnabled ? (
        <div className="wizard-container flex-col animate-fade-in">
          {renderWizardHeader()}
          <main className="station-card" style={{ padding: '32px', minHeight: '400px' }}>
            {renderStepContent()}
          </main>
        </div>
      ) : (
        <section className="station-card flex-col" style={{ gap: '20px' }}>
          <div className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="station-form-section-title">{t('letter.ui.resources').toUpperCase()}</span>
          </div>
          <div className="alert-box warning">Legacy view is currently minimized in development. Use Supervisor to enable Wizard.</div>
        </section>
      )}

      {(selectedPresetId || dataFile) && (
        <div className="station-registry-actions flex-row" style={{ 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginTop: '12px',
          padding: '16px',
          background: 'var(--surface-color)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px'
        }}>
          <div className="flex-row" style={{ gap: '12px' }}>
            <button className="station-btn station-btn-side" title="Exportar Almacén Local (JSON↓)" onClick={() => addLog('EXPORTACIÓN_LOCAL_INICIADA', 'info')}>JSON↓</button>
            <button className="station-btn station-btn-side" title="Importar Configuración (ALL↑)" onClick={() => addLog('IMPORTACIÓN_LOCAL_BLOQUEADA_MODO_RED_ZERO', 'warning')}>ALL↑</button>
          </div>

          {canStartEngine && (
            <button 
              className="station-btn station-btn-primary" 
              disabled={isProcessing || !canGenerate} 
              style={{ minWidth: '320px', height: '56px', fontSize: '1.2rem', fontWeight: 900 }} 
              onClick={handleStart}
            >
              <PlayIcon size={24} /> {!canGenerate ? 'UNAUTHORIZED' : (isProcessing ? t('common.processing').toUpperCase() : t('letter.ui.btn_generate').toUpperCase())}
            </button>
          )}
        </div>
      )}

      {pendingDownload && (
        <div className="station-card flex-col" style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid var(--status-ok)', gap: '12px' }}>
          <span style={{ color: 'var(--status-ok)', fontWeight: 700, textAlign: 'center' }}>{t('letter.ui.gen_success_inline').toUpperCase()}</span>
          <div className="flex-row" style={{ gap: '12px' }}>
            <button className="station-btn station-btn-primary" style={{ flex: 1, background: 'var(--status-ok)', color: 'white', height: '50px' }} onClick={() => triggerDownload(pendingDownload.blob, pendingDownload.name)}>
              <DownloadIcon size={20} /> {t('letter.ui.download_full').toUpperCase()}
            </button>
            <button className="station-btn" style={{ height: '50px', background: 'rgba(255,215,0,0.1)', color: '#FFD700', border: '1px solid #FFD700' }} onClick={async () => {
              if (rendererEngine && pendingDownload) {
                const hash = await rendererEngine.captureFingerprint(pendingDownload.blob, pendingDownload.name);
                await db.golden_tests_v6.add({
                  templateId: selectedTemplateId!,
                  mappingId: selectedMapping?.id || '',
                  etlPresetId: selectedPresetId!,
                  codDocumento: options.codDocumento,
                  version: '1.000',
                  layoutHash: hash,
                  hashAlgorithm: 'SHA-256',
                  renderSpec: 'v1:page1@144dpi:gray:512x724',
                  createdAt: Date.now(),
                  updatedAt: Date.now()
                });
                addLog('SÍMBOLO GOLDEN GUARDADO EN EL REGISTRO DE QA.', 'info');
              }
            }}>🏆 {t('letter.ui.save_golden').toUpperCase()}</button>
          </div>
        </div>
      )}

      {canDiag && (environment !== 'PROD' || isTechnicianMode) && (
        <div className="station-card" style={{ background: 'rgba(239, 68, 68, 0.03)', border: '1px dashed rgba(239, 68, 68, 0.15)', marginTop: 'auto', padding: '16px' }}>
          <div className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="flex-col">
              <span style={{ fontSize: '11px', fontWeight: 900, color: 'var(--status-err)' }}>INDUSTRIAL_DIAGNOSTIC_CONSOLE_V4</span>
              <span style={{ fontSize: '10px', opacity: 0.5 }}>MODO TÉCNICO ACTIVADO - PRUEBAS DE ESTRÉS PDF</span>
            </div>
            <div className="flex-row" style={{ gap: '12px' }}>
              <button className="station-btn" style={{ height: '36px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--status-err)', fontWeight: 800, border: '1px solid rgba(239, 68, 68, 0.2)' }} onClick={() => handleRunStressTest(5)} disabled={isProcessing}><ZapIcon size={14} /> TEST (5)</button>
              <button className="station-btn" style={{ height: '36px', background: 'var(--status-err)', color: 'white', fontWeight: 800 }} onClick={() => handleRunStressTest(50)} disabled={isProcessing}><ZapIcon size={14} /> MASSIVE (50)</button>
            </div>
          </div>
        </div>
      )}

      <div className="station-integrity-badge" style={{ position: 'fixed', bottom: '24px', right: '24px' }}>
         <div className="integrity-dot" />
         <FileTextIcon size={14} />
         <span>ESTÁNDAR GAWEB v.1 (ERA 6)</span>
      </div>

      <RendererHost onReady={setRendererEngine} />
    </div>
  );
};

export default LetterStation;
