export type AuditModule = 'SYSTEM_AUDIT' | 'LETTER_QA' | 'GAWEB_AUDIT' | 'CRYPT';

export interface BaseAuditRecord {
  id: string;              // UUID
  module: AuditModule;
  timestamp: number;       // Date.now()
  level: 'info' | 'warning' | 'error';
  messageKey: string;      // i18n key
}

export interface GawebAuditPayload {
  fileName: string;
  totalLines: number;
  totalErrors: number;
  totalWarnings: number;
  errorsByType: Record<string, number>;
  md5Index?: string;
}

export interface LetterQaPayload {
  lote: string;
  codDocumento: string;
  version: string;
  qaStatus: 'MATCH' | 'BREAK' | 'NO_GOLDEN';
  layoutHash?: string;
  goldenHash?: string;
}

export interface CryptAuditPayload {
  mode: 'encrypt' | 'decrypt';
  filesProcessed: number;
  success: number;
  error: number;
  skip: number;
}

export type AuditPayload =
  | { type: 'GAWEB_AUDIT', data: GawebAuditPayload }
  | { type: 'LETTER_QA', data: LetterQaPayload }
  | { type: 'CRYPT', data: CryptAuditPayload };

export interface AuditRecord extends BaseAuditRecord {
  payload: AuditPayload;
}
