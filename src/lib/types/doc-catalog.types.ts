/**
 * Local Document Catalog Types (Phase 18)
 * Centralizes the link between HOST codes (CATDOCUM) and Suite resources.
 */
export interface LocalDocCatalogEntry {
  id: string;               // UUID
  codigoDocumento: string;  // Xnnnnn (Primary Industrial Key)
  name: string;             // Human readable name
  procesoCodigo: string;    // CAH, CAT, etc.
  formatoSoporte: '01' | '02' | '03' | '04' | '05';
  
  defaultTemplateId?: string;     // FK -> letter_templates.id
  defaultGoldenProfileId?: string; // FK -> gaweb_golden_profiles.id
  
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
  
  metadata?: Record<string, any>;
}
