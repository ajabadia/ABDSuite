import Dexie, { type Table } from 'dexie';
import { EtlPreset } from '../types/etl.types';
import { LetterTemplate, LetterMapping } from '../types/letter.types';

export class ABDFNSuiteDB extends Dexie {
  presets!: Table<EtlPreset>;
  letter_templates!: Table<LetterTemplate>;
  letter_mappings!: Table<LetterMapping>;

  constructor() {
    super('ABDFNSuiteDB');
    this.version(4).stores({
      presets: '++id, name, gawebConfig.active, updatedAt',
      letter_templates: '++id, name, type, updatedAt',
      letter_mappings: '++id, name, templateId, etlPresetId, updatedAt'
    });
  }
}

export const db = new ABDFNSuiteDB();
