/**
 * ABDFN Suite - CATDOCUM Types (Phase 19)
 * Centralizes document business metadata and links codes to resources.
 */

export type DocChannel = 'GAWEB' | 'BATCH' | 'ONDEMAND';
export type DocSupport = 'PDF' | 'DOCX' | 'HTML';

export interface CatDocumRecord {
  id: string;                 // uuid era 6
  codDocumento: string;       // X00054 (6 chars)
  businessName: string;       // Nombre funcional
  category: string;           // ALTA, BAJA, etc.
  version: string;            // ej "1.000"
  
  // Enlaces funcionales
  templateId: string | null;  
  mappingId: string | null;   
  presetId: string | null;    // FK opcional para desambiguar pipeline

  channel: DocChannel;
  support: DocSupport;
  languageIso: string | null; // Restaurado para Phase 20
  
  isActive: boolean;
  isDefaultForCode: boolean;  // Prioridad cuando hay múltiples candidatos
  
  pagesDefault: number | null;
  notes: string;
  
  createdAt: number;
  updatedAt: number;
  
  goldenTestId?: string | null; // Vínculo con QA visual
}
