export type EtlRecordBehavior = 'HEADER' | 'DATA' | 'FOOTER';

export interface EtlField {
  id: string; // Unique transient ID for UI tracking
  name: string;
  start: number;
  length: number;
}

export interface EtlRecordType {
  name: string;
  trigger: string;
  triggerStart: number;
  behavior: EtlRecordBehavior;
  range: string; // Supports "1", "1-2", "1,3"
  fields: EtlField[];
  maxLength?: number;
}

export interface GawebConfig {
  active: boolean;
  tipoSoporte: 'OV' | 'PDF';
  formatoCarta: string;
  forzarMetodo: string;
  indicadorDestino: string;
  tipoDestino: string;
  codigoEntorno: string;
  codigoDocumento: string;
  fechaGeneracion: string;
  fechaCarta: string;
  oficina: string;
  paginasDefecto: number;
  idioma: string;
  viaReparto: string;
  copiaPapel: string;
  // Ahorro (AH) Block
  savingsOpCode?: string; // AH
  savingsOpAccount?: string;
  savingsOpSign?: string;
  savingsOpAmount?: string;
  savingsOpCurrency?: string;
  savingsOpISO?: string;
  savingsOpConcept?: string;
  windowOffsetX?: number; // mm
  windowOffsetY?: number; // mm
}

export interface EtlPreset {
  id?: number; // Primary key for Dexie (auto-incremented)
  name: string;
  version: string;
  description: string;
  chunkSize: number;
  encoding: string;
  
  // Type identification globals
  recordTypeStart: number;
  recordTypeLen: number;
  defaultRecordType: string;
  headerTypeId: string;
  
  recordTypes: EtlRecordType[];
  isActive: boolean;
  
  // Letter Station Extension
  gawebConfig?: GawebConfig;

  createdAt: number;
  updatedAt: number;
}

export interface EtlGlobalSettings {
  defaultPath: string;
  language: string;
  defaultEncoding: string;
  defaultChunkSize: number;
}
