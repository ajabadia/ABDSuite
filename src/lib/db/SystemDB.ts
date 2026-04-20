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
  
  // ERA 6 Additions
  unitsv6!: Table<WorkspaceUnit>;
  coreSettings!: Table<{ id: string; [key: string]: any }>;

  constructor() {
    super('ABDFN_CORE');
    this.version(7).stores({
      units: 'id, code, name, isActive',
      operators: 'id, displayName, username, pinHash, unitIds, role, isActive, isMaster',
      system_log: 'id, timestamp, action, status',
      
      // ERA 6 - UUID & Registry Optimized
      unitsv6: 'id, code, env, isActive',
      coreSettings: 'id'
    });
    
    this.units = this.table('units');
    this.operators = this.table('operators');
    this.system_log = this.table('system_log');
    this.unitsv6 = this.table('unitsv6');
    this.coreSettings = this.table('coreSettings');
  }
}

export const coreDb = new ABDFNCoreDB();
