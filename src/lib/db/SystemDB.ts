import Dexie, { type Table } from 'dexie';
import { WorkspaceUnit, Operator } from '../types/auth.types';

/**
 * ABDFNCoreDB
 * Global Registry database for units and operators.
 * Database Name: ABDFN_CORE
 */
export class ABDFNCoreDB extends Dexie {
  units!: Table<WorkspaceUnit>;
  operators!: Table<Operator>;
  system_log!: Table<{ id: string; timestamp: number; action: string; details: string; status: string }>;

  constructor() {
    super('ABDFN_CORE');
    this.version(1).stores({
      units: 'id, code, name, isActive',
      operators: 'id, name, pinHash, unitIds, role, isActive',
      system_log: 'id, timestamp, action, status'
    });
    
    this.units = this.table('units');
    this.operators = this.table('operators');
    this.system_log = this.table('system_log');
  }
}

export const coreDb = new ABDFNCoreDB();
