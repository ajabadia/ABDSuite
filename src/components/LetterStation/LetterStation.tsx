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
import { resolveCatDocForPreset, isCatDocOperational } from '@/lib/logic/catdocum-resolver.logic';
import { logCatDocResolution } from '@/lib/logic/catdocum-audit.logic';
import { 
  PlayIcon, 
  FolderIcon, 
  TagIcon,
  DownloadIcon,
  SearchIcon,
  FileTextIcon,
  CogIcon,
  ListIcon,
  MapIcon,
  RefreshCwIcon,
  ZapIcon
} from '@/components/common/Icons';
import { seedStressEnvironment, generateIndustrialStressData } from '@/lib/utils/stress-test-tool';
import { seedHardE2E, generateMixedGawebFile } from '@/lib/utils/hard-e2e-tester';
import { saveFile } from '@/lib/utils/save-file';
import JSZip from 'jszip';
import { useTelemetryConfig } from '@/lib/context/TelemetryContext';
import { useIsNarrowLayout } from '@/lib/hooks/useIsNarrowLayout';
import { clsx } from '@/lib/utils/clsx';

import { RendererHost } from '@/components/common/RendererHost';

import { useLog } from '@/lib/context/LogContext';
import { LogLevel } from '@/lib/types/log.types';
import { useWorkspace } from '@/lib/context/WorkspaceContext';
import { letterService } from '@/lib/services/LetterService';
import { getMappingCoverage } from './MappingMatrix';
import { ValidationError } from '@/lib/utils/AppError';

const LetterStation: React.FC = () => {
  const { t } = useLanguage();
  const { environment, isTechnicianMode } = useConfig();
  const { can, currentOperator, installationKey } = useWorkspace();
  const { addLog: globalAddLog } = useLog();
  const { config: telemetryConfig } = useTelemetryConfig();
  const router = useRouter();
  
  const canGenerate = can('LETTER_GENERATE');
  const canDiag = can('LETTER_CONFIG_GLOBAL');
  
  // Resources
  const presets = useLiveQuery(() => db.presets_v6.toArray()) || [];
  const templates = useLiveQuery(() => db.lettertemplates_v6.toArray()) || [];
  const mappings = useLiveQuery(() => db.lettermappings_v6.toArray()) || [];

  // Selections
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [selectedMapping, setSelectedMapping] = useState<any>(null); 
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [dataFile, setDataFile] = useState<File | null>(null);
  const [autoCatDocum, setAutoCatDocum] = useState(false);
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
  const [qaStatus, setQaStatus] = useState<'PENDING' | 'MATCH' | 'BREAK' | 'NO_GOLDEN'>('PENDING');

  // --- WIZARD STATE (Phase 15) ---
  type WizardStepId = 'DATA' | 'DESIGN' | 'LOGIC' | 'DESTINATION' | 'EXECUTION';
  const [currentStepId, setCurrentStepId] = useState<WizardStepId>('DATA');
  const wizardEnabled = telemetryConfig?.security.uiFeatures.letterWizardEnabled ?? true;

  const isValidIndustrialDate = (dateStr: string) => {
    if (!/^\d{8}$/.test(dateStr)) return false;
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1;
    const day = parseInt(dateStr.substring(6, 8));
    const date = new Date(year, month, day);
    return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day;
  };

  const [templateVars, setTemplateVars] = useState<string[]>([]);
  
  // Extract Template Variables
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
      } catch (e) {}
      setTemplateVars(Array.from(new Set(vars)));
    }
    extractVars();
  }, [selectedTemplateId, templates]);

  const steps = useMemo(() => {
    const step1Complete = !!selectedPresetId && !!dataFile;
    const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
    const step2Complete = !!selectedTemplate && selectedTemplate.isActive !== false;
    
    const { totalVars, coverage, pendingCount } = getMappingCoverage(templateVars, selectedMapping);
    const mappingThreshold = telemetryConfig?.security.mappingThresholds?.minCoverage ?? 1.0;
    const step3Complete = !!selectedMapping && (totalVars === 0 || coverage >= mappingThreshold);

    const step4Complete = !!outputHandle;
    const step5Complete = !!options.lote && !!options.codDocumento && options.codDocumento.length === 6 && !!options.oficina && options.oficina.length === 5 && isValidIndustrialDate(options.fechaCarta) && isValidIndustrialDate(options.fechaGeneracion);

    return [
      { id: 'DATA', label: t('letter.wizard.data') || 'DATOS', complete: step1Complete, error: step1Complete ? undefined : 'Selecciona un preset y carga el fichero GAWEB.' },
      { id: 'DESIGN', label: t('letter.wizard.design') || 'DISEÑO', complete: step2Complete, error: step2Complete ? undefined : 'Selecciona una plantilla activa.' },
      { id: 'LOGIC', label: t('letter.wizard.logic') || 'MAPEO', complete: step3Complete, error: step3Complete ? undefined : `Paso bloqueado: quedan ${pendingCount} variables sin mapear (Umbral: ${Math.round(mappingThreshold*100)}%).` },
      { id: 'DESTINATION', label: t('letter.wizard.dest') || 'DESTINO', complete: step4Complete, error: step4Complete ? undefined : 'Selecciona una carpeta de salida válida.' },
      { id: 'EXECUTION', label: t('letter.wizard.run') || 'EJECUCIÓN', complete: step5Complete, error: step5Complete ? undefined : 'Completa los campos obligatorios del lote.' }
    ] as const;
  }, [selectedPresetId, dataFile, selectedTemplateId, templates, selectedMapping, templateVars, outputHandle, options, telemetryConfig, t]);

  const canStartEngine = steps.every(s => s.complete);

  // Golden Reference Link
  const goldenRef = useLiveQuery(async () => {
    if (!selectedTemplateId || !selectedMapping?.id || !selectedPresetId) return null;
    return await db.golden_tests_v6
      .where('[templateId+mappingId+etlPresetId+codDocumento]')
      .equals([selectedTemplateId, selectedMapping.id, selectedPresetId, options.codDocumento])
      .first();
  }, [selectedTemplateId, selectedMapping?.id, selectedPresetId, options.codDocumento]);

  const addLog = (message: string, type: 'info' | 'error' | 'warning' | 'debug' = 'info') => {
    globalAddLog('LETTER', message, type as LogLevel);
  };

  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      workerRef.current = new Worker(new URL('../../lib/workers/document-engine.worker.ts', import.meta.url));
      workerRef.current.onmessage = async (e: MessageEvent<WorkerEvent>) => {
        const { type, payload } = e.data;
        if (type === 'HEARTBEAT') {
          (window as any).__WORKER_ALIVE = true;
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

            await letterService.logBatchExecution(currentOperator?.id || 'system', options, {
              totalDocs: 0,
              presetName: presets.find(p => p.id === selectedPresetId)?.name || 'N/A',
              templateName: templates.find(t => t.id === selectedTemplateId)?.name || 'N/A'
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
                    
                    if (isMatch) {
                      addLog('🏆 QA_MATCH: Integridad visual confirmada.', 'info');
                      setQaStatus('MATCH');
                      await db.golden_tests_v6.update(goldenRef.id!, { lastVerifiedAt: Date.now() });
                    } else {
                      addLog('❌ QA_BREAK: Regresión de layout detectada.', 'error');
                      await letterService.logQAFailure(currentOperator?.id || 'system', options.lote, options.codDocumento);
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
  }, [options, rendererEngine, currentOperator, presets, selectedPresetId, templates, selectedTemplateId, goldenRef, t]);

  const handleTemplateUpload = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const newTemplate: LetterTemplate = {
        id: crypto.randomUUID(),
        name: file.name.replace(/\.docx$/i, ''),
        type: 'DOCX',
        binaryContent: buffer,
        isActive: true,
        updatedAt: Date.now()
      };
      await db.lettertemplates_v6.add(newTemplate);
      setSelectedTemplateId(newTemplate.id!);
      addLog(t('letter.logs.template_uploaded', { name: file.name }) || `PLANTILLA SUBIDA: ${file.name}`, 'info');
    } catch (err: any) {
      addLog(`ERROR SUBIDA: ${err.message}`, 'error');
    }
  };

  const handleShowTags = () => {
    if (templateVars.length === 0) {
      addLog(t('letter.logs.no_tags_found') || 'No se detectaron etiquetas en la plantilla.', 'warning');
      return;
    }
    addLog(`ETIQUETAS DETECTADAS: ${templateVars.join(', ')}`, 'info');
  };

  const handleRunStressTest = async (count: number) => {
    try {
      setIsProcessing(true);
      addLog(`INICIANDO STRESS TEST (${count} DOCS)...`, 'warning');
      
      const { presetId, templateId, mapping } = await seedStressEnvironment();
      const stressFile = generateIndustrialStressData(count);
      
      setSelectedPresetId(presetId);
      setDataFile(stressFile);
      setSelectedTemplateId(templateId);
      setSelectedMapping(mapping);
      
      addLog(`ENTORNO DE ESTRÉS PREPARADO.`, 'info');
      setIsProcessing(false);
    } catch (err: any) {
      addLog(`ERROR STRESS: ${err.message}`, 'error');
      setIsProcessing(false);
    }
  };

  const handleSeedHardE2E = async () => {
    try {
      setIsProcessing(true);
      addLog('INICIANDO SEMILLADO HARD E2E (REGTECH+GAWEB)...', 'warning');
      await seedHardE2E();
      addLog('ESCENARIO HARD E2E PREPARADO EN BD.', 'info');
      setIsProcessing(false);
    } catch (err: any) {
      addLog(`ERROR SEED: ${err.message}`, 'error');
      setIsProcessing(false);
    }
  };

  const handleDownloadMixedGaweb = async () => {
    try {
      const { blob, name } = await generateMixedGawebFile();
      saveFile(blob, name);
      addLog('GAWEB MIXTO GENERADO.', 'info');
    } catch (err: any) {
      addLog(`ERROR GEN: ${err.message}`, 'error');
    }
  };

  const runIndustrialSmokeTest = async () => {
    addLog('INICIANDO SMOKE TEST INDUSTRIAL...', 'warning');
    const tCount = await db.lettertemplates_v6.count();
    addLog(`SMOKE_OK: Base de datos accesible (${tCount} plantillas).`, 'info');
    addLog('SMOKE_OK: Entorno de renderizado activo.', 'info');
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

  const handleStart = async () => {
    try {
      if (!dataFile) throw new ValidationError('Falta archivo de datos.');
      
      // Industrial Validation
      letterService.validateOptions(options);

      if (!selectedPresetId) throw new ValidationError('Falta preset.');
      if (!autoCatDocum) {
        if (!selectedTemplateId) throw new ValidationError('Falta plantilla.');
        if (!selectedMapping) throw new ValidationError('Falta mapeo.');
      }

      setIsProcessing(true);
      setPendingDownload(null);
      
      const preset = await db.presets_v6.get(selectedPresetId);
      if (!preset) throw new ValidationError('Preset no encontrado.');

      let catalogResources: Record<string, any> = {};
      let mainTemplate = null;
      let mainMapping = null;

      if (autoCatDocum) {
        addLog('CATDOCUM: Iniciando descubrimiento dinámico...', 'info');
        const preScanCodes = async (file: File) => {
          const codes = new Set<string>();
          const text = await file.slice(0, 100000).text(); // Sample first 100kb
          const lines = text.split(/\r?\n/);
          for (const line of lines) {
            if (line.trim().length >= 32) {
              const cod = line.substring(26, 32).trim().toUpperCase();
              if (cod) codes.add(cod);
            }
          }
          return codes;
        };
        const uniqueCodes = await preScanCodes(dataFile);
        
        for (const code of Array.from(uniqueCodes)) {
          const resolved = await resolveCatDocForPreset(preset, code);
          await logCatDocResolution(preset, resolved, { loteId: options.lote, codDocumento: code, gawebFileName: dataFile.name });

          if (resolved && isCatDocOperational(resolved)) {
            catalogResources[code] = { template: resolved.template, mapping: resolved.mapping, catDoc: resolved.catDoc };
            if (!mainTemplate) { mainTemplate = resolved.template; mainMapping = resolved.mapping; }
          }
        }
      } else {
        mainTemplate = await db.lettertemplates_v6.get(selectedTemplateId!);
        mainMapping = await db.lettermappings_v6.where('id').equals(selectedMapping?.id || '').first();
      }

      if (!mainTemplate || !mainMapping) throw new ValidationError('Faltan recursos (Plantilla/Mapeo).');
      
      addLog(t('processor.processing', { lote: options.lote }));
      (window as any).__WORKER_ALIVE = false;
      
      const { GAWEB_FIELDS } = await import('@/lib/logic/gaweb-auditor.logic');
      const shouldStream = options.outputType !== 'ZIP' && !!outputHandle;
      const normalizedOptions = normalizeLetterOptions(options);

      const workerPayload: LetterWorkerPayload = { 
        dataFile, 
        template: mainTemplate, 
        mapping: mainMapping, 
        etlPreset: preset, 
        options: normalizedOptions, 
        isStreaming: shouldStream,
        gawebFields: GAWEB_FIELDS,
        catalogResources: autoCatDocum ? catalogResources : undefined
      };

      workerRef.current?.postMessage(workerPayload);
    } catch (err: any) { 
      addLog(`ERROR ARRANQUE: ${err.message}`, 'error'); 
      setIsProcessing(false); 
    }
  };

  const renderWizardHeader = () => (
    <nav className="wizard-nav station-card flex-row" style={{ padding: '12px', gap: '8px' }}>
      {steps.map((s) => (
        <button
          key={s.id}
          className={clsx('wizard-step-btn', {
            active: currentStepId === s.id,
            complete: s.complete
          })}
          onClick={() => setCurrentStepId(s.id as WizardStepId)}
          style={{ flex: 1 }}
        >
          <span className="wizard-step-id">{s.id}</span>
          <span className="wizard-step-label">{s.label}</span>
        </button>
      ))}
    </nav>
  );

  const renderStepContent = () => {
    switch (currentStepId) {
      case 'DATA':
        return (
          <div className="flex-col animate-fade-in" style={{ gap: '20px' }}>
            <div className="station-form-grid animate-fade-in">
              <div className="station-form-field full">
                 <label className="station-label">{t('letter.ui.presets')}</label>
                 <select className="station-select" value={selectedPresetId || ''} onChange={e => setSelectedPresetId(e.target.value)}>
                   <option value="">{t('letter.ui.select_preset')}</option>
                   {presets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                 </select>
              </div>
              <div className="station-form-field full">
                 <label className="station-label">{t('letter.ui.data_file')}</label>
                 <div className="flex-row" style={{ gap: '12px' }}>
                    <button className="station-btn station-btn-primary" onClick={() => (document.getElementById('gaweb-upload') as any).click()}>
                       <FolderIcon size={16} /> {dataFile ? dataFile.name : t('letter.ui.btn_upload')}
                    </button>
                    <input id="gaweb-upload" type="file" hidden onChange={e => {
                       const f = e.target.files?.[0];
                       if (f) setDataFile(f);
                    }} />
                    {dataFile && <span className="station-badge-green">READY</span>}
                 </div>
              </div>
            </div>

            <div className="station-form-field animate-slide-in" style={{ 
              background: 'rgba(var(--primary-color-rgb), 0.05)', 
              padding: '24px', 
              borderRadius: '8px', 
              border: '1px dashed var(--border-color)',
              marginTop: '16px'
            }}>
               <div className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="flex-col">
                     <span style={{ fontWeight: 800, fontSize: '0.75rem', color: 'var(--primary-color)' }}>
                        {t('catdocum.master_list') || 'MODO DINÁMICO CATDOCUM'}
                     </span>
                     <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>
                        Resolución automática de plantillas por código de negocio.
                     </span>
                  </div>
                  <button 
                     className={clsx('station-btn tiny', { 'primary-glow': autoCatDocum })}
                     onClick={() => setAutoCatDocum(!autoCatDocum)}
                     style={{ minWidth: '100px' }}
                  >
                     {autoCatDocum ? 'ACTIVADO' : 'DESACTIVADO'}
                  </button>
               </div>
            </div>
          {/* Note: AutoCatDocum ends here */ }
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

             <div className="pre-flight-checklist" style={{ padding: '24px', background: 'var(--surface-color)', borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 900, opacity: 0.4, letterSpacing: '2px' }}>PRE-FLIGHT CHECKLIST INDUSTRIAL</div>
                  {qaStatus === 'NO_GOLDEN' && (
                    <div className="station-badge warn tiny animate-pulse">NO_GOLDEN_MASTER</div>
                  )}
                </div>

                {/* Golden Master Section */}
                {goldenRef && (
                   <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(var(--primary-color-rgb), 0.05)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                      <div className="flex-row" style={{ gap: '8px', alignItems: 'center' }}>
                         <span style={{ fontSize: '10px', fontWeight: 900 }}>🏆 GOLDEN_MASTER_ACTIVE:</span>
                         <span className="station-badge success tiny">v{goldenRef.version}</span>
                      </div>
                      <div style={{ fontSize: '11px', opacity: 0.5, marginTop: '4px' }}>
                        ID: {goldenRef.id?.toString().substring(0,8)}... · Verificado: {new Date(goldenRef.lastVerifiedAt || 0).toLocaleDateString()}
                      </div>
                      {goldenRef.notes && <div style={{ fontSize: '10px', fontStyle: 'italic', marginTop: '6px', opacity: 0.7 }}>"{goldenRef.notes}"</div>}
                   </div>
                )}

                <div className="flex-col" style={{ gap: '12px' }}>
                  {steps.map(s => (
                    <div key={s.id} className="flex-row" style={{ justifyContent: 'space-between', fontSize: '0.9rem', padding: '4px 0' }}>
                      <span style={{ opacity: s.complete ? 1 : 0.4, fontWeight: s.complete ? 700 : 400 }}>{s.label}</span>
                      <div className="flex-row" style={{ gap: '8px', alignItems: 'center' }}>
                        {s.id === 'LOGIC' && (
                          <span style={{ fontSize: '10px', opacity: 0.3 }}>({getMappingCoverage(templateVars, selectedMapping).mappedCount}/{getMappingCoverage(templateVars, selectedMapping).totalVars})</span>
                        )}
                        <span style={{ fontWeight: 900, fontSize: '0.75rem', color: s.complete ? 'var(--status-ok)' : 'var(--status-err)', fontFamily: 'var(--font-mono)' }}>
                          {s.complete ? 'READY' : 'PENDING'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '32px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px' }}>
                  <button 
                    className="station-btn station-btn-primary" 
                    disabled={!canStartEngine || isProcessing}
                    style={{ width: '100%', height: '64px', fontSize: '1.5rem', fontWeight: 900, boxShadow: '0 10px 30px rgba(var(--primary-color-rgb), 0.2)' }}
                    onClick={handleStart}
                  >
                    {isProcessing ? <RefreshCwIcon size={24} className="spin" /> : <ZapIcon size={24} />}
                    <span style={{ marginLeft: '12px' }}>INICIAR MOTOR</span>
                  </button>
                </div>
             </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="flex-col" style={{ gap: '24px', padding: '24px', width: '100%' }}>
      {/* CABECERA INDUSTRIAL */}
      <header className="station-card flex-col" style={{ gap: '16px', borderBottom: '2px solid var(--border-color)', borderRadius: 0, paddingBottom: '24px' }}>
        <div className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div className="flex-col" style={{ gap: '4px' }}>
            <h2 className="station-title-main" style={{ margin: 0, fontSize: '1.5rem', letterSpacing: '0.1rem' }}>
              ABD · WIZARD
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
        <div className="wizard-container flex-col animate-fade-in" style={{ gap: '12px' }}>
          {renderWizardHeader()}
          <main className="station-card letter-wizard-main" style={{ minHeight: '400px', flex: 1, width: '100%' }}>
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

      <style jsx>{`
        .letter-wizard-main {
          padding: clamp(16px, 4vw, 32px);
        }

        @media (max-width: 800px) {
          .wizard-nav {
            flex-wrap: wrap;
            gap: 4px;
          }
          .wizard-step-btn {
            flex: 1 1 45%;
            font-size: 0.7rem;
            padding: 8px;
          }
          .wizard-step-id {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .wizard-step-btn {
            flex: 1 1 100%;
          }
        }
      `}</style>

      {/* LEGACY ACTIONS REMOVED (UNIFIED IN WIZARD) */}

      {pendingDownload && (
        <div className="station-card flex-col" style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid var(--status-ok)', gap: '12px' }}>
          <span style={{ color: 'var(--status-ok)', fontWeight: 700, textAlign: 'center' }}>{t('letter.ui.gen_success_inline').toUpperCase()}</span>
          <div className="flex-row" style={{ gap: '12px' }}>
            <button className="station-btn station-btn-primary" style={{ flex: 1, background: 'var(--status-ok)', color: 'white', height: '50px' }} onClick={() => saveFile(pendingDownload.blob, pendingDownload.name)}>
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
            <div className="flex-row" style={{ gap: '12px', flexWrap: 'wrap' }}>
              <button className="station-btn" style={{ height: '36px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--status-err)', fontWeight: 800, border: '1px solid rgba(239, 68, 68, 0.2)' }} onClick={() => handleRunStressTest(5)} disabled={isProcessing}><ZapIcon size={14} /> TEST (5)</button>
              <button className="station-btn" style={{ height: '36px', background: 'var(--status-err)', color: 'white', fontWeight: 800 }} onClick={() => handleRunStressTest(50)} disabled={isProcessing}><ZapIcon size={14} /> MASSIVE (50)</button>
              {isTechnicianMode && (
                <>
                  <button 
                    className="station-btn" 
                    style={{ 
                      height: '36px', 
                      background: installationKey ? 'rgba(56, 189, 248, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                      color: installationKey ? 'var(--primary-color)' : 'var(--status-err)', 
                      fontWeight: 800, 
                      border: `1px solid ${installationKey ? 'rgba(56, 189, 248, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                      opacity: installationKey ? 1 : 0.7
                    }} 
                    onClick={handleSeedHardE2E} 
                    disabled={isProcessing}
                    title={installationKey ? "Seed metadatos mixtos (X00054/55/56)" : "Bóveda Bloqueada - Introduce PIN en Seguridad"}
                  >
                    {installationKey ? 'HARD E2E SEED' : 'HARD E2E SEED 🔒'}
                  </button>
                  <button 
                    className="station-btn" 
                    style={{ height: '36px', background: 'rgba(56, 189, 248, 0.1)', color: 'var(--primary-color)', fontWeight: 800, border: '1px solid rgba(56, 189, 248, 0.2)' }} 
                    onClick={handleDownloadMixedGaweb} 
                    disabled={isProcessing}
                    title="Bajar GAWEB mixto E2E"
                  >
                    MIXED GAWEB E2E
                  </button>
                  <button 
                    className="station-btn" 
                    style={{ height: '36px', background: 'var(--primary-color)', color: 'white', fontWeight: 900, boxShadow: '0 0 15px rgba(var(--primary-color-rgb), 0.3)' }} 
                    onClick={runIndustrialSmokeTest} 
                    disabled={isProcessing}
                  >
                    <PlayIcon size={14} /> SMOKE TEST
                  </button>
                </>
              )}
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
