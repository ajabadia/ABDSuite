import { z } from 'zod';

export interface LetterTemplate {
  id?: number;
  name: string;
  content: string; // HTML with {{variables}}
  updatedAt: number;
}

export type MappingSourceType = 'TEMPLATE' | 'GAWEB' | 'UI_OVERRIDE';

export interface VariableMapping {
  templateVar: string;
  sourceField: string; // Refers to the name/ID of the field in ETL Preset
  sourceType: MappingSourceType;
}

/**
 * 27 Canonical GAWEB fields for Industrial HOST Alignment (Phase E)
 * Standardized English Technical Keys matching translations and logic.
 */
export const CANONICAL_GAWEB_FIELDS = [
  "LetterType",
  "Format",
  "GenerationDate",
  "Batch",
  "Sequential",
  "Page",
  "DocCode",
  "Version",
  "ContractClass",
  "ContractCode",
  "TIREL",
  "NUREL",
  "CLALF",
  "INDOM",
  "ForceSend",
  "Language",
  "SavingOpCode",
  "SavingOpAccount",
  "SavingOpSign",
  "SavingOpAmount",
  "SavingOpCurrency",
  "SavingOpISO",
  "SavingOpConcept",
  "LetterDate",
  "DestinationIndicator",
  "LoadDetail",
  "DeliveryWay",
  "PaperCopy",
  "OfficeCode",
  "EmailFax",
  "ContentLength",
  "PdfName"
];

/**
 * UI Overrides: Fields that can be ignored in mapping if provided via UI forms.
 */
export const UI_OVERRIDE_MAPPING: Record<string, string> = {
  "LetterDate": "letterDate",
  "DocCode": "docCode",
  "OfficeCode": "officeCode",
  "Batch": "batch",
  "GenerationDate": "generationDate",
};

/**
 * Zod Schema for the full 251-character industrial record.
 * Ensures the Configurator produces HOST-compliant payloads.
 */
export const GawebRecordSchema = z.object({
  LetterType: z.string().length(1).default(' '),
  Format: z.string().length(2).default('04'),
  GenerationDate: z.string().length(8),
  Batch: z.string().length(4),
  Sequential: z.string().length(7),
  Page: z.string().length(4).default('0001'),
  DocCode: z.string().length(6),
  Version: z.string().length(4).default('0000'),
  ContractClass: z.string().length(2).default('  '),
  ContractCode: z.string().length(25).default(' '.repeat(25)),
  TIREL: z.string().length(1).default(' '),
  NUREL: z.string().length(3).default('000'),
  CLALF: z.string().length(15).default(' '.repeat(15)),
  INDOM: z.string().length(2).default('00'),
  ForceSend: z.string().length(1).default(' '),
  Language: z.string().length(2).default('  '),
  SavingOpCode: z.string().length(2).default('  '),
  SavingOpAccount: z.string().length(25).default(' '.repeat(25)),
  SavingOpSign: z.string().length(1).default(' '),
  SavingOpAmount: z.string().length(13).default('0'.repeat(13)),
  SavingOpCurrency: z.string().length(2).default('  '),
  SavingOpISO: z.string().length(3).default('   '),
  SavingOpConcept: z.string().length(2).default('  '),
  LetterDate: z.string().length(8),
  DestinationIndicator: z.string().length(1).default('0'),
  LoadDetail: z.string().length(4).default('0000'),
  DeliveryWay: z.string().length(2).default('  '),
  PaperCopy: z.string().length(1).default(' '),
  OfficeCode: z.string().length(5),
  EmailFax: z.string().length(50).default(' '.repeat(50)),
  ContentLength: z.string().length(5).default('00000'),
  PdfName: z.string().length(40)
});

export type GawebRecord = z.infer<typeof GawebRecordSchema>;

export interface LetterMapping {
  id?: number;
  name: string;
  templateId: number;
  etlPresetId: number;
  mappings: VariableMapping[];
  updatedAt: number;
}

export interface LetterGenerationOptions {
  lote: string;
  oficina: string;
  codDocumento: string;
  fechaGeneracion: string;
  fechaCarta: string;
  rangeFrom: number;
  rangeTo: number;
  outputType: 'PDF' | 'PDF_GAWEB' | 'ZIP';
}
