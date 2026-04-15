import { z } from 'zod';
import { EtlPreset } from './etl.types';

export const EtlProcessorOptionsSchema = z.object({
  startRow: z.number().min(1).default(1),
  endRow: z.number().min(0).default(0), // 0 = All
  chunkSize: z.number().min(10).default(900000),
  outputFormat: z.enum(['CSV', 'JSON']).default('CSV'),
  encoding: z.enum(['utf-8', 'windows-1252']).default('utf-8'),
});

export type EtlProcessorOptions = z.infer<typeof EtlProcessorOptionsSchema>;

export interface WorkerMessage {
  type: 'START' | 'CANCEL' | 'DATA_CHUNK';
  payload?: any;
}

export interface ProcessorProgress {
  totalLines: number;
  processedLines: number;
  currentType?: string;
  filesGenerated: string[];
}

export interface ProcessorLogEntry {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: number;
}
