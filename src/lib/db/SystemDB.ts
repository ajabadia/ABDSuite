import Dexie, { type Table } from 'dexie';
import { WorkspaceUnit, Operator } from '../types/auth.types';
import { applyEncryptedMiddleware, EncryptedFieldsConfig } from './EncryptedDbAdapter';

/**
 * ABDFNCoreDB
 * Global Registry database for units and operators.
 * Database Name: ABDFN_CORE
 */
export class ABDFNCoreDB extends Dexie {
  units!: Table<WorkspaceUnit>;
  operators!: Table<Operator>;
  system_log!: Table<{ id: string; timestamp: number; category: string; action: string; details: string; status: string }>;
  
  // ERA 6 Additions
  unitsv6!: Table<WorkspaceUnit>;
  coreSettings!: Table<{ id: string; [key: string]: any }>;

  // At-Rest Encryption (v6.0.0-IND)
  private _keyProvider: () => CryptoKey | null = () => null;

  constructor() {
    super('ABDFN_CORE');

    const coreConfig: EncryptedFieldsConfig = {
      operators: ['mfaSecret']
    };

    applyEncryptedMiddleware(this, 'ABDFN_CORE', null, coreConfig, () => this._keyProvider());

    this.version(9).stores({
      units: 'id, code, name, isActive',
      operators: 'id, displayName, username, pinHash, unitIds, role, isActive, isMaster, failedPinAttempts, failedMfaAttempts',
      system_log: 'id, timestamp, category, action, status',
      
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

  /**
   * Inject the Installation Key provider from the Workspace context
   */
  setKeyProvider(provider: () => CryptoKey | null) {
      this._keyProvider = provider;
  }
}

export const coreDb = new ABDFNCoreDB();
