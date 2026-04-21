import { PackageAuditResult } from '../logic/package-auditor.logic';
import { GawebGoldenProfile } from './gaweb-golden.types';
import { AuditSamplingSettings } from './telemetry.types';

export type AuditWorkerInMessage =
  | {
      type: 'START_AUDIT';
      payload: {
        gawebFile: File;              
        zipFile?: File;               
        md5Witness?: string;          
        encoding?: 'windows-1252' | 'utf-8';
        maxErrorsPreview?: number;    
        goldenProfile?: GawebGoldenProfile;
        sampling?: AuditSamplingSettings;
      };
    }
  | {
      type: 'REQUEST_DATA_WINDOW';
      payload: {
        start: number; // 1-based line
        end: number;   
      };
    }
  | {
      type: 'REQUEST_ERRORS_WINDOW';
      payload: {
        start: number; // 0-based index
        end: number;
      };
    }
  | {
      type: 'CANCEL_AUDIT';
    };

export interface GawebSummary {
  totalLines: number;
  totalErrors: number;
  totalWarnings: number;
  errorsByType: Record<string, number>;
  md5Matches?: boolean;
}

export interface GawebRow {
  line: number;
  fields: Record<string, string>;
}

export interface GawebErrorLite {
  index: number;
  line: number;
  field: string;
  position: string;
  severity: 'ERROR' | 'WARNING';
  messageKey: string;
  value: string;
}

export type AuditWorkerOutMessage =
  | { type: 'HEARTBEAT' }
  | {
      type: 'PROGRESS';
      payload: {
        processedLines: number;
        errorsSoFar: number;
        warningsSoFar: number;
      };
    }
  | { type: 'SUMMARY_READY'; payload: GawebSummary }
  | {
      type: 'DATA_WINDOW';
      payload: {
        start: number;
        end: number;
        rows: GawebRow[];
      };
    }
  | {
      type: 'ERRORS_WINDOW';
      payload: {
        start: number;
        end: number;
        errors: GawebErrorLite[];
      };
    }
  | { type: 'PACKAGE_RESULT'; payload: PackageAuditResult }
  | {
      type: 'LOG';
      payload: {
        level: 'info' | 'warning' | 'error';
        messageKey: string;
        params?: any;
      };
    }
  | { type: 'COMPLETE' }
  | { type: 'FATAL_ERROR'; payload: { message: string } };
