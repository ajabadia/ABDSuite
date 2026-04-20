/**
 * ABDFN Unified Suite - Worker Contracts (Era 6)
 * Strict interfaces for Document Engine communication.
 */

import { LetterGenerationOptions, GawebRecord, LetterTemplate, LetterMapping } from './letter.types';
import { EtlPreset } from './etl.types';

export type WorkerMessageType = 
  | 'START' 
  | 'HEARTBEAT' 
  | 'LOG' 
  | 'DOCUMENT_READY' 
  | 'COMPLETE' 
  | 'ERROR';

export interface LetterWorkerPayload {
  dataFile: File;
  template: LetterTemplate;
  mapping: LetterMapping;
  etlPreset: EtlPreset;
  options: LetterGenerationOptions;
  isStreaming?: boolean;
  gawebFields?: any[];
}

export interface WorkerEvent {
  type: WorkerMessageType;
  payload?: {
    message?: string;
    type?: 'info' | 'error' | 'warning' | 'debug';
    name?: string;
    content?: ArrayBuffer;
    blob?: Blob;
    count?: number;
    isFirst?: boolean;
  };
}
