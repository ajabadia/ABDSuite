import { z } from 'zod';

// --- LETTER SCHEMAS ---

export const LetterGenerationOptionsSchema = z.object({
  lote: z.string().length(4).regex(/^\d+$/),
  oficina: z.string().length(5).regex(/^\d+$/),
  codDocumento: z.string().length(6).regex(/^[xX]\d{5}$/),
  fechaGeneracion: z.string().length(8).regex(/^\d{8}$/),
  fechaCarta: z.string().length(8).regex(/^\d{8}$/),
  rangeFrom: z.number().min(0),
  rangeTo: z.number().min(0),
  outputType: z.enum(['PDF', 'PDF_GAWEB', 'ZIP']),
});

export const LetterTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['HTML', 'DOCX']),
  content: z.string().optional(),
  isActive: z.boolean().default(true),
});

// --- CRYPT SCHEMAS ---

export const CryptOptionsSchema = z.object({
  mode: z.enum(['encrypt', 'decrypt']),
  password: z.string().min(8),
  outputSuffix: z.string().min(1).max(50),
});

// --- AUDIT SCHEMAS ---

export const AuditOptionsSchema = z.object({
  encoding: z.enum(['utf-8', 'iso-8859-1', 'windows-1252']).default('iso-8859-1'),
  maxErrorsPreview: z.number().min(100).max(10000).default(5000),
  sampling: z.object({
    enabled: z.boolean(),
    maxPerType: z.number().min(1),
    sampleEvery: z.number().min(1),
    maxPerDay: z.number().min(100),
  }).optional(),
});
