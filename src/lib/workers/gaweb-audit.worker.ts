/// <reference lib="webworker" />

import { auditGawebLine } from '../logic/gaweb-auditor.logic';
import { auditPackageIntegrity } from '../logic/package-auditor.logic';
import type {
  AuditWorkerInMessage,
  AuditWorkerOutMessage,
  GawebSummary,
  GawebRow,
  GawebErrorLite,
} from '../types/audit-worker.types';

declare const self: DedicatedWorkerGlobalScope;

interface AuditWorkerState {
  isRunning: boolean;
  totalLines: number;
  totalErrors: number;
  totalWarnings: number;
  errorsByType: Record<string, number>;
  dataPreview: GawebRow[];
  errorsPreview: GawebErrorLite[];
  maxErrorsPreview: number;
  encoding: 'windows-1252' | 'utf-8';
}

let state: AuditWorkerState = resetState();

function resetState(): AuditWorkerState {
  return {
    isRunning: false,
    totalLines: 0,
    totalErrors: 0,
    totalWarnings: 0,
    errorsByType: {},
    dataPreview: [],
    errorsPreview: [],
    maxErrorsPreview: 500,
    encoding: 'windows-1252',
  };
}

function post(msg: AuditWorkerOutMessage) {
  self.postMessage(msg);
}

self.onmessage = async (event: MessageEvent<AuditWorkerInMessage>) => {
  const data = event.data;

  if (data.type === 'START_AUDIT') {
    const { payload } = data;

    if (state.isRunning) {
        state.isRunning = false; // Cancel existing
    }
    
    state = resetState();
    state.isRunning = true;
    if (payload.encoding) state.encoding = payload.encoding;
    if (payload.maxErrorsPreview) state.maxErrorsPreview = payload.maxErrorsPreview;

    try {
      post({ type: 'HEARTBEAT' });
      await runGawebAuditStreaming(payload.gawebFile, payload.zipFile, payload.md5Witness);
      
      const summary: GawebSummary = {
        totalLines: state.totalLines,
        totalErrors: state.totalErrors,
        totalWarnings: state.totalWarnings,
        errorsByType: state.errorsByType
      };
      post({ type: 'SUMMARY_READY', payload: summary });
      post({ type: 'COMPLETE' });
    } catch (err: any) {
      post({ type: 'FATAL_ERROR', payload: { message: err?.message || 'Unknown Audit Error' } });
    } finally {
      state.isRunning = false;
    }
  }

  if (data.type === 'REQUEST_DATA_WINDOW') {
    const { start, end } = data.payload;
    const rows = state.dataPreview.filter(r => r.line >= start && r.line <= end);
    post({ type: 'DATA_WINDOW', payload: { start, end, rows } });
  }

  if (data.type === 'REQUEST_ERRORS_WINDOW') {
    const { start, end } = data.payload;
    const errors = state.errorsPreview.slice(start, end + 1);
    post({ type: 'ERRORS_WINDOW', payload: { start, end, errors } });
  }

  if (data.type === 'CANCEL_AUDIT') {
    state.isRunning = false;
  }
};

async function runGawebAuditStreaming(gawebFile: File, zipFile?: File, md5Witness?: string) {
  const reader = (gawebFile as any).stream().getReader();
  const decoder = new TextDecoder(state.encoding);

  let partialLine = '';
  let processedSinceLastProgress = 0;

  while (state.isRunning) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunkText = decoder.decode(value, { stream: true });
    const text = partialLine + chunkText;
    const lines = text.split(/\r?\n/);
    partialLine = lines.pop() ?? '';

    for (const line of lines) {
      if (!state.isRunning) break;
      processSingleLine(line);
      processedSinceLastProgress++;

      if (processedSinceLastProgress >= 1000) {
        post({
          type: 'PROGRESS',
          payload: {
            processedLines: state.totalLines,
            errorsSoFar: state.totalErrors,
            warningsSoFar: state.totalWarnings
          }
        });
        processedSinceLastProgress = 0;
      }
    }
  }

  if (state.isRunning && partialLine.trim() !== '') {
    processSingleLine(partialLine);
  }

  if (zipFile && state.isRunning) {
    // Generamos un resultado parcial para la integridad del paquete
    const gawebResultPreview = {
      parsedData: state.dataPreview.map(r => r.fields),
      errors: state.errorsPreview.map(e => ({
        line: e.line,
        field: e.field,
        position: e.position,
        severity: e.severity,
        messageKey: e.messageKey,
        value: e.value
      }))
    };
    
    const pkg = await auditPackageIntegrity(gawebResultPreview as any, zipFile, md5Witness);
    post({ type: 'PACKAGE_RESULT', payload: pkg });
  }
}

function processSingleLine(rawLine: string) {
  const lineNo = state.totalLines + 1;
  const { record, errors, warnings } = auditGawebLine(rawLine, lineNo);
  
  state.totalLines++;
  
  const allAnomalies = [...errors, ...warnings];
  for (const exp of allAnomalies) {
    if (exp.severity === 'ERROR') state.totalErrors++;
    if (exp.severity === 'WARNING') state.totalWarnings++;
    
    const key = exp.messageKey;
    state.errorsByType[key] = (state.errorsByType[key] || 0) + 1;
  }
  
  // Guardamos en el buffer de previsualización (limitado para no saturar RAM)
  if (state.dataPreview.length < 10000) {
    state.dataPreview.push({ line: lineNo, fields: record });
  }
  
  for (const exp of allAnomalies) {
    if (state.errorsPreview.length >= state.maxErrorsPreview) break;
    state.errorsPreview.push({
      index: state.errorsPreview.length,
      line: exp.line,
      field: exp.field,
      position: exp.position,
      severity: exp.severity as any,
      messageKey: exp.messageKey,
      value: exp.value
    });
  }
}
