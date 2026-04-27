import { EtlPreset } from './etl.types';
import { LetterTemplate, LetterMapping } from './letter.types';
import { GoldenTest, AuditHistoryRecord } from '../db/db';
import { GawebGoldenProfile } from './gaweb-golden.types';
import { LocalDocCatalogEntry } from './doc-catalog.types';
import { CatDocumRecord } from './catdocum.types';

export interface ExportOptions {
  includeEtl?: boolean;
  includeLetter?: boolean;
  includeCatalog?: boolean;
  includeAudit?: boolean;
  includeGaweb?: boolean;
}

export interface SuiteDump {
  version: 'abdfn-suite-v6';
  generatedAt: string;
  presets?: EtlPreset[];
  templates?: LetterTemplateDump[];
  mappings?: LetterMapping[];
  goldenTests?: GoldenTest[];
  auditHistory?: AuditHistoryRecord[];
  gawebProfiles?: GawebGoldenProfile[];
  docCatalog?: LocalDocCatalogEntry[];
  catDocum?: CatDocumRecord[];
}

export interface LetterTemplateDump extends Omit<LetterTemplate, 'binaryContent'> {
  binaryBase64?: string; // DOCX as base64
}

