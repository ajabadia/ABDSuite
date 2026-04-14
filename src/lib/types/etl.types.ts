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
  createdAt: number;
  updatedAt: number;
}
