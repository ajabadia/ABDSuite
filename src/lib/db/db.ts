import Dexie, { type Table } from 'dexie';
import { EtlPreset } from '../types/etl.types';

export class ABDFNSuiteDB extends Dexie {
  presets!: Table<EtlPreset>;

  constructor() {
    super('ABDFNSuiteDB');
    this.version(1).stores({
      presets: '++id, name, updatedAt' // Primary key and indexed fields
    });
  }
}

export const db = new ABDFNSuiteDB();
