'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/context/LanguageContext';
import { EtlPreset } from '@/lib/types/etl.types';
import { EtlProcessorOptions } from '@/lib/types/etl-processor.types';
import { RefreshIcon, FolderIcon, PlayIcon, CogIcon } from '@/components/common/Icons';
import { useLog } from '@/lib/context/LogContext';
import { LogLevel } from '@/lib/types/log.types';

import { useWorkspace } from '@/lib/context/WorkspaceContext';
import { ForbiddenPanel } from '@/components/common/ForbiddenPanel';
import { etlService } from '@/lib/services/EtlService';
import { StationHeader } from '@/components/shell/StationHeader';

interface EtlRunnerProps {
  presets: EtlPreset[];
  selectedPreset: EtlPreset | null;
  onSelect: (preset: EtlPreset) => void;
}

const EtlRunner: React.FC<EtlRunnerProps> = ({ presets, selectedPreset, onSelect }) => {
  const { t } = useLanguage();
  const { can, currentOperator } = useWorkspace();
  const router = useRouter();

  const isAllowed = can('ETL_RUN');

  if (!isAllowed) {
    return <ForbiddenPanel capability="ETL_RUN" />;
  }

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

  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    globalAddLog('ETL', message, type as LogLevel);
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

    try {
      // Industrial Validation
      etlService.validateOptions(options);
      
      setIsProcessing(true);
      outputStreamsRef.current = new Map();

      addLog(`${t('etl.logs.start')}: ${selectedPreset.name}`, 'info');
      await etlService.logEtlStart(currentOperator?.id || 'system', selectedPreset.name, inputFile.name);

      const worker = new Worker(new URL('../../lib/workers/etl-processor.worker.ts', import.meta.url));
      workerRef.current = worker;

      worker.onmessage = async (e) => {
        const { type, payload } = e.data;
        switch (type) {
          case 'LOG': addLog(payload.message, payload.type); break;
          case 'RECORD': await handleRecord(payload); break;
          case 'COMPLETE':
            await cleanupStreams();
            setIsProcessing(false);
            addLog(t('etl.logs.complete'), 'success');
            await etlService.logEtlComplete(currentOperator?.id || 'system', selectedPreset.name, { fileName: inputFile.name });
            break;
        }
      };

      worker.postMessage({
        file: inputFile,
        preset: selectedPreset,
        options: { ...options, encoding: selectedPreset.encoding as any || options.encoding }
      });
    } catch (err: any) {
      addLog(err.message, 'error');
      setIsProcessing(false);
    }
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
    <div className="flex-col animate-fade-in" style={{ gap: '24px', height: '100%', padding: '0 24px' }}>
      
      <StationHeader 
        title={selectedPreset?.name || t('etl.runner_title').toUpperCase()}
        engineId={`ETL_REFINERY_V6_${selectedPreset?.version || '1.0'}`}
        actions={
            selectedPreset && (
              <button className="station-btn secondary" onClick={handleEditDesign}>
                <CogIcon size={16} /> {t('settings.title').toUpperCase()}
              </button>
            )
        }
        rightElement={
            <div className="flex-col" style={{ alignItems: 'flex-end', gap: '2px' }}>
                <span className={`station-badge ${isProcessing ? 'warn' : (selectedPreset ? 'success' : 'info')}`}>
                    {isProcessing ? t('etl.status_active').toUpperCase() : (selectedPreset ? t('etl.status_ready').toUpperCase() : t('etl.status_idle').toUpperCase())}
                </span>
            </div>
        }
      />

      <section className="station-card">
        <div className="station-tech-summary" style={{ marginTop: 0 }}>
          <div className="station-tech-item"><span className="station-tech-label">{t('etl.input').toUpperCase()}:</span> {inputFile?.name || 'NONE'}</div>
          <div className="station-tech-item"><span className="station-tech-label">{t('etl.output').toUpperCase()}:</span> {outputHandle?.name || 'NONE'}</div>
          <div className="station-tech-item"><span className="station-tech-label">{t('etl.status_label').toUpperCase()}:</span> {isProcessing ? t('etl.status_running').toUpperCase() : t('etl.status_standby').toUpperCase()}</div>
        </div>
      </section>

      <div className="flex-row" style={{ gap: '24px', alignItems: 'flex-start' }}>
          <section className="station-card flex-col" style={{ gap: '16px', flex: 1 }}>
            <span className="station-form-section-title">{t('etl.source_destination').toUpperCase()}</span>
            <div className="station-form-grid">
              <div className="station-form-field full">
                <label className="station-label">{t('etl.input_file').toUpperCase()}</label>
                <div className="flex-row" style={{ gap: '8px' }}>
                  <input className="station-input" readOnly value={inputFile?.name || ''} placeholder="..." style={{ fontWeight: 800 }} />
                  <input type="file" id="etl-run-in" style={{ display: 'none' }} onChange={e => setInputFile(e.target.files?.[0] || null)} />
                  <button className="station-btn secondary icon-only" onClick={() => document.getElementById('etl-run-in')?.click()}><FolderIcon size={16} /></button>
                </div>
              </div>
              <div className="station-form-field full">
                <label className="station-label">{t('etl.output_path').toUpperCase()}</label>
                <div className="flex-row" style={{ gap: '8px' }}>
                  <input className="station-input" readOnly value={outputHandle?.name || ''} placeholder="..." style={{ fontWeight: 800 }} />
                  <button className="station-btn secondary icon-only" onClick={handlePickOutput}><FolderIcon size={16} /></button>
                </div>
              </div>
            </div>
          </section>

          <section className="station-card flex-col" style={{ gap: '16px', flex: 1 }}>
            <span className="station-form-section-title">{t('etl.engine_parameters').toUpperCase()}</span>
            <div className="station-form-grid">
               <div className="station-form-field">
                 <label className="station-label">{t('etl.default_chunk').toUpperCase()}</label>
                 <input type="number" className="station-input" value={options.chunkSize} onChange={e => setOptions({...options, chunkSize: parseInt(e.target.value) || 0})} style={{ fontWeight: 800 }} />
               </div>
               <div className="station-form-field">
                 <label className="station-label">{t('etl.format').toUpperCase()}</label>
                 <select className="station-select" value={options.outputFormat} onChange={e => setOptions({...options, outputFormat: e.target.value as any})} style={{ fontWeight: 800 }}>
                    <option value="CSV">{t('etl.format_csv').toUpperCase()}</option>
                    <option value="JSON">{t('etl.format_json').toUpperCase()}</option>
                 </select>
               </div>
               <div className="station-form-field">
                 <label className="station-label">{t('etl.start_row').toUpperCase()}</label>
                 <input type="number" className="station-input" value={options.startRow} onChange={e => setOptions({...options, startRow: parseInt(e.target.value) || 1})} style={{ fontWeight: 800 }} />
               </div>
               <div className="station-form-field">
                 <label className="station-label">{t('etl.max_records').toUpperCase()}</label>
                 <input type="number" className="station-input" value={options.endRow} onChange={e => setOptions({...options, endRow: parseInt(e.target.value) || 0})} style={{ fontWeight: 800 }} />
               </div>
            </div>
          </section>
      </div>

      <button 
        className={`station-btn primary ${isProcessing ? 'processing' : ''}`}
        style={{ height: '72px', fontSize: '1.2rem', fontWeight: 900, letterSpacing: '2px' }}
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
    </div>
  );
};

export default EtlRunner;
