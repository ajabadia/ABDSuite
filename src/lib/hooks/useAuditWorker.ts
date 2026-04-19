'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type {
  AuditWorkerInMessage,
  AuditWorkerOutMessage,
  GawebSummary,
  GawebRow,
  GawebErrorLite,
} from '../types/audit-worker.types';
import { PackageAuditResult } from '../logic/package-auditor.logic';

export interface AuditProgress {
  processedLines: number;
  errorsSoFar: number;
  warningsSoFar: number;
}

export interface UseAuditWorkerResult {
  isRunning: boolean;
  progress: AuditProgress | null;
  summary: GawebSummary | null;
  packageResult: PackageAuditResult | null;
  dataWindows: Map<string, GawebRow[]>;
  errorsWindows: Map<string, GawebErrorLite[]>;
  
  startAudit: (args: { gawebFile: File; zipFile?: File; md5Witness?: string }) => void;
  requestDataWindow: (start: number, end: number) => void;
  requestErrorsWindow: (start: number, end: number) => void;
  cancelAudit: () => void;
  reset: () => void;
}

export function useAuditWorker(options: { maxErrorsPreview?: number; encoding?: string } = {}): UseAuditWorkerResult {
  const workerRef = useRef<Worker | null>(null);
  
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<AuditProgress | null>(null);
  const [summary, setSummary] = useState<GawebSummary | null>(null);
  const [packageResult, setPackageResult] = useState<PackageAuditResult | null>(null);
  
  const [dataWindows, setDataWindows] = useState<Map<string, GawebRow[]>>(new Map());
  const [errorsWindows, setErrorsWindows] = useState<Map<string, GawebErrorLite[]>>(new Map());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Industrial URL pattern para workers en Next.js
    const worker = new Worker(new URL('../workers/gaweb-audit.worker.ts', import.meta.url));
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<AuditWorkerOutMessage>) => {
      const msg = event.data;
      
      switch (msg.type) {
        case 'PROGRESS':
          setProgress(msg.payload);
          break;
        case 'SUMMARY_READY':
          setSummary(msg.payload);
          break;
        case 'DATA_WINDOW':
          setDataWindows(prev => {
            const next = new Map(prev);
            next.set(`${msg.payload.start}-${msg.payload.end}`, msg.payload.rows);
            return next;
          });
          break;
        case 'ERRORS_WINDOW':
          setErrorsWindows(prev => {
            const next = new Map(prev);
            next.set(`${msg.payload.start}-${msg.payload.end}`, msg.payload.errors);
            return next;
          });
          break;
        case 'PACKAGE_RESULT':
          setPackageResult(msg.payload);
          break;
        case 'COMPLETE':
          setIsRunning(false);
          break;
        case 'FATAL_ERROR':
          setIsRunning(false);
          console.error('Audit Worker Fatal Error:', msg.payload.message);
          break;
      }
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setProgress(null);
    setSummary(null);
    setPackageResult(null);
    setDataWindows(new Map());
    setErrorsWindows(new Map());
  }, []);

  const startAudit = useCallback(({ gawebFile, zipFile, md5Witness }: { gawebFile: File; zipFile?: File; md5Witness?: string }) => {
    if (!workerRef.current) return;
    reset();
    setIsRunning(true);
    
    workerRef.current.postMessage({
      type: 'START_AUDIT',
      payload: {
        gawebFile,
        zipFile,
        md5Witness,
        encoding: options.encoding || 'iso-8859-1',
        maxErrorsPreview: options.maxErrorsPreview || 1000
      }
    });
  }, [reset, options.encoding, options.maxErrorsPreview]);

  const requestDataWindow = useCallback((start: number, end: number) => {
    const key = `${start}-${end}`;
    if (dataWindows.has(key) || !workerRef.current) return;
    workerRef.current.postMessage({ type: 'REQUEST_DATA_WINDOW', payload: { start, end } });
  }, [dataWindows]);

  const requestErrorsWindow = useCallback((start: number, end: number) => {
    const key = `${start}-${end}`;
    if (errorsWindows.has(key) || !workerRef.current) return;
    workerRef.current.postMessage({ type: 'REQUEST_ERRORS_WINDOW', payload: { start, end } });
  }, [errorsWindows]);

  const cancelAudit = useCallback(() => {
    if (workerRef.current) workerRef.current.postMessage({ type: 'CANCEL_AUDIT' });
    setIsRunning(false);
  }, []);

  return {
    isRunning,
    progress,
    summary,
    packageResult,
    dataWindows,
    errorsWindows,
    startAudit,
    requestDataWindow,
    requestErrorsWindow,
    cancelAudit,
    reset
  };
}
