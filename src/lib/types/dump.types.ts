import { EtlPreset } from './etl.types';
import { LetterTemplate, LetterMapping } from './letter.types';
import { GoldenTest, AuditHistoryRecord } from '../db/db';

export interface SuiteDump {
  version: 'abdfn-suite-v6';
  generatedAt: string;
  presets: EtlPreset[];
  templates: LetterTemplateDump[];
  mappings: LetterMapping[];
  goldenTests?: GoldenTest[];
  auditHistory?: AuditHistoryRecord[];
}

export interface LetterTemplateDump extends Omit<LetterTemplate, 'binaryContent'> {
  binaryBase64?: string; // DOCX as base64
}
