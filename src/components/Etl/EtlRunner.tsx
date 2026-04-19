'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/context/LanguageContext';
import { EtlPreset } from '@/lib/types/etl.types';
import { EtlProcessorOptions, ProcessorLogEntry } from '@/lib/types/etl-processor.types';
import { RefreshIcon, FolderIcon, PlayIcon, SquareIcon, CogIcon } from '@/components/common/Icons';
import { useLog } from '@/lib/context/LogContext';
import { LogLevel } from '@/lib/types/log.types';

interface EtlRunnerProps {
  presets: EtlPreset[];
  selectedPreset: EtlPreset | null;
  onSelectPreset: (preset: EtlPreset) => void;
}

const EtlRunner: React.FC<EtlRunnerProps> = ({ presets, selectedPreset, onSelectPreset }) => {
  const { t } = useLanguage();
  const router = useRouter();
  const { addLog: globalAddLog } = useLog();
  const [inputFile, setInputFile] = useState<File | null>(null);
  const [outputHandle, setOutputHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [options, setOptions] = useState<EtlProcessorOptions>({
    startRow: 1,
    endRow: 0,
    chunkSize: 500000,
    outputFormat: 'CSV',
    encoding: 'utf-8',
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const outputStreamsRef = useRef<Map<string, { stream: FileSystemWritableFileStream, count: number, part: number }>>(new Map());

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const addLog = (entry: any) => {
    let level: LogLevel = 'info';
    if (entry.type === 'success') level = 'success';
    if (entry.type === 'error') level = 'error';
    if (entry.type === 'warn') level = 'warn';
    
    globalAddLog('ETL', entry.message, level);
  };

  const handlePickOutput = async () => {
    try {
      const handle = await (window as any).showDirectoryPicker();
      setOutputHandle(handle);
    } catch (err) { }
  };

  const handleEditDesign = () => {
    if (selectedPreset) {
      router.push(`/etl?view=designer&id=${selectedPreset.id}`);
    }
  };

  const startProcess = async () => {
    if (!inputFile || !selectedPreset || !outputHandle) return;

    setIsProcessing(true);
    outputStreamsRef.current = new Map();

    addLog({ type: 'info', message: `${t('etl.logs.start')}: ${selectedPreset.name}` });

    const worker = new Worker(new URL('../../lib/workers/etl-processor.worker.ts', import.meta.url));
    workerRef.current = worker;

    worker.onmessage = async (e) => {
      const { type, payload } = e.data;
      switch (type) {
        case 'LOG': addLog(payload); break;
        case 'RECORD': await handleRecord(payload); break;
        case 'COMPLETE':
          cleanupStreams();
          setIsProcessing(false);
          addLog({ type: 'success', message: t('etl.logs.complete') });
          break;
      }
    };

    worker.postMessage({
      file: inputFile,
      preset: selectedPreset,
      options: { ...options, encoding: selectedPreset.encoding as any || options.encoding }
    });
  };

  const handleRecord = async (payload: { typeName: string, data: any, headers: string[] }) => {
    if (!outputHandle) return;
    const { typeName, data, headers } = payload;
    let streamRef = outputStreamsRef.current.get(typeName);

    if (!streamRef || streamRef.count >= options.chunkSize) {
      if (streamRef) await streamRef.stream.close();
      const part = streamRef ? streamRef.part + 1 : 1;
      const fileName = `${inputFile?.name.split('.')[0]}_${typeName}${part > 1 ? `_Part${part}` : ''}.${options.outputFormat.toLowerCase()}`;
      const fileHandle = await outputHandle.getFileHandle(fileName, { create: true });
      const stream = await (fileHandle as any).createWritable();
      
      if (options.outputFormat === 'CSV') {
        const headerLine = headers.join(';') + '\n';
        await stream.write(headerLine);
      } else if (options.outputFormat === 'JSON') {
        await stream.write('[\n');
      }
      streamRef = { stream, count: 0, part };
      outputStreamsRef.current.set(typeName, streamRef);
    }

    if (options.outputFormat === 'CSV') {
      const values = headers.map(h => data[h] || '');
      await streamRef.stream.write(values.join(';') + '\n');
    } else if (options.outputFormat === 'JSON') {
      const prefix = streamRef.count > 0 ? ',\n  ' : '  ';
      await streamRef.stream.write(prefix + JSON.stringify(data));
    }
    streamRef.count++;
  };

  const cleanupStreams = async () => {
    for (const ref of outputStreamsRef.current.values()) {
      if (options.outputFormat === 'JSON') await ref.stream.write('\n]');
      await ref.stream.close();
    }
    outputStreamsRef.current.clear();
  };

  return (
    <div className="flex-col" style={{ gap: '24px', height: '100%' }}>
      
      {/* CABECERA INDUSTRIAL (Era 6) */}
      <div className="station-card">
        <div className="station-panel-header" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: 0 }}>
          <div className="flex-col" style={{ gap: '4px' }}>
            <h2 className="station-title-main" style={{ margin: 0 }}>{selectedPreset?.name || t('etl.runner_title').toUpperCase()}</h2>
            <div className="flex-row" style={{ alignItems: 'center', gap: '12px' }}>
               <span style={{ opacity: 0.5, fontSize: '0.75rem', fontWeight: 700 }}>V{selectedPreset?.version || '1.0'}</span>
               <span className={`station-badge ${isProcessing ? 'station-badge-orange' : 'station-badge-green'}`}>
                  {isProcessing ? t('etl.status_active').toUpperCase() : (selectedPreset ? t('etl.status_ready').toUpperCase() : t('etl.status_idle').toUpperCase())}
               </span>
            </div>
          </div>
          <div className="flex-row" style={{ gap: '12px' }}>
            {selectedPreset && (
              <button className="station-btn" onClick={handleEditDesign}>
                <CogIcon size={16} /> {t('settings.title').toUpperCase()}
              </button>
            )}
          </div>
        </div>

        <div className="station-tech-summary" style={{ marginTop: '24px' }}>
          <div className="station-tech-item"><span className="station-tech-label">{t('etl.input').toUpperCase()}:</span> {inputFile?.name || 'NONE'}</div>
          <div className="station-tech-item"><span className="station-tech-label">{t('etl.output').toUpperCase()}:</span> {outputHandle?.name || 'NONE'}</div>
          <div className="station-tech-item"><span className="station-tech-label">{t('etl.status_label').toUpperCase()}:</span> {isProcessing ? t('etl.status_running').toUpperCase() : t('etl.status_standby').toUpperCase()}</div>
        </div>
      </div>

      <div className="station-card">
        <span className="station-form-section-title">{t('etl.source_destination').toUpperCase()}</span>
        <div className="station-form-grid" style={{ marginTop: '16px' }}>
          <div className="station-form-field medium">
            <label className="station-label">{t('etl.input_file').toUpperCase()}</label>
            <div className="flex-row" style={{ gap: '8px' }}>
              <input className="station-input" readOnly value={inputFile?.name || ''} placeholder="..." />
              <input type="file" id="etl-run-in" style={{ display: 'none' }} onChange={e => setInputFile(e.target.files?.[0] || null)} />
              <button className="station-btn icon-only" onClick={() => document.getElementById('etl-run-in')?.click()}><FolderIcon size={16} /></button>
            </div>
          </div>
          <div className="station-form-field medium">
            <label className="station-label">{t('etl.output_path').toUpperCase()}</label>
            <div className="flex-row" style={{ gap: '8px' }}>
              <input className="station-input" readOnly value={outputHandle?.name || ''} placeholder="..." />
              <button className="station-btn icon-only" onClick={handlePickOutput}><FolderIcon size={16} /></button>
            </div>
          </div>
        </div>
      </div>

      <div className="station-card">
        <span className="station-form-section-title">{t('etl.engine_parameters').toUpperCase()}</span>
        <div className="station-form-grid" style={{ marginTop: '16px' }}>
           <div className="station-form-field">
             <label className="station-label">{t('etl.default_chunk').toUpperCase()}</label>
             <input type="number" className="station-input" value={options.chunkSize} onChange={e => setOptions({...options, chunkSize: parseInt(e.target.value) || 0})} />
           </div>
           <div className="station-form-field medium">
             <label className="station-label">{t('etl.format').toUpperCase()}</label>
             <select className="station-select" value={options.outputFormat} onChange={e => setOptions({...options, outputFormat: e.target.value as any})}>
                <option value="CSV">{t('etl.format_csv').toUpperCase()}</option>
                <option value="JSON">{t('etl.format_json').toUpperCase()}</option>
             </select>
           </div>
           <div className="station-form-field">
             <label className="station-label">{t('etl.start_row').toUpperCase()}</label>
             <input type="number" className="station-input" value={options.startRow} onChange={e => setOptions({...options, startRow: parseInt(e.target.value) || 1})} />
           </div>
           <div className="station-form-field">
             <label className="station-label">{t('etl.max_records').toUpperCase()}</label>
             <input type="number" className="station-input" value={options.endRow} onChange={e => setOptions({...options, endRow: parseInt(e.target.value) || 0})} />
           </div>
        </div>
      </div>

      <button 
        className={`station-btn station-btn-primary ${isProcessing ? 'processing' : ''}`}
        style={{ height: '72px', fontSize: '1.2rem', fontWeight: 800, letterSpacing: '2px' }}
        disabled={!inputFile || !outputHandle || !selectedPreset || isProcessing}
        onClick={startProcess}
      >
        {isProcessing ? (
          <div className="flex-row" style={{ gap: '12px', alignItems: 'center' }}>
            <span className="station-shimmer-text">{t('etl.status_executing').toUpperCase()}</span>
          </div>
        ) : (
          <><PlayIcon size={24} /> {t('etl.runner').toUpperCase()}</>
        )}
      </button>

      {/* SELLO DE INTEGRIDAD (Era 6) */}
      <div className="station-integrity-badge" style={{ position: 'fixed', bottom: '24px', right: '24px' }}>
         <div className="integrity-dot" />
         <CogIcon size={14} />
         <span>{t('dashboard.dash_etl_title').toUpperCase()} - {selectedPreset?.encoding?.toUpperCase() || 'UTF-8'}</span>
      </div>
    </div>
  );
};


export default EtlRunner;
