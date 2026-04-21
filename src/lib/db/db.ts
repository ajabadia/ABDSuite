import Dexie, { type Table } from 'dexie';
import { EtlPreset } from '../types/etl.types';
import { LetterTemplate, LetterMapping } from '../types/letter.types';
import { GawebGoldenProfile } from '../types/gaweb-golden.types';
import { LocalDocCatalogEntry } from '../types/doc-catalog.types';
import { applyEncryptedMiddleware, EncryptedFieldsConfig } from './EncryptedDbAdapter';

export interface GoldenTest {
  id?: string;
  templateId: string;          // FK -> letter_templates.id
  mappingId: string;           // FK -> letter_mappings.id
  etlPresetId: string;         // FK -> presets.id
  codDocumento: string;        // GAWEB DocCode (X00054)
  version: string;             // versión de plantilla (ej. "1.000")
  layoutHash: string;          // SHA-256 (hex) de la huella visual del doc 1
  hashAlgorithm: 'SHA-256';
  renderSpec: string;          // Protocolo (ej. "v1:page1@144dpi:gray:512x724")
  createdAt: number;
  updatedAt: number;
  notes?: string;
  lastVerifiedAt?: number;
}

export interface AuditHistoryRecord {
  id?: string;
  timestamp: number;
  category: string;
  module: 'LETTER' | 'AUDIT' | 'CRYPT' | 'SECURITY' | 'SYSTEM' | 'SUPERVISOR';
  action: string;
  details: string; // JSON string with counts, errors, etc.
  status: 'SUCCESS' | 'WARNING' | 'ERROR';
}

/**
 * ABDFNSuiteDB (Data Layer)
 * Scoped per Unit/Department for isolation.
 */
export class ABDFNSuiteDB extends Dexie {
  presets_v6!: Table<EtlPreset>;
  lettertemplates_v6!: Table<LetterTemplate>;
  lettermappings_v6!: Table<LetterMapping>;
  golden_tests_v6!: Table<GoldenTest>;
  audit_history_v6!: Table<AuditHistoryRecord>;
  gaweb_golden_profiles_v6!: Table<GawebGoldenProfile>;
  doc_catalog_v1!: Table<LocalDocCatalogEntry>;

  private _unitId: string;
  private static _keyProvider: () => CryptoKey | null = () => null;

  constructor(unitId: string) {
    super(`ABDFN_UNIT_${unitId}`);
    this._unitId = unitId;

    const suiteConfig: EncryptedFieldsConfig = {
      lettertemplates_v6: ['binaryContent', 'content'],
      audit_history_v6: ['details']
    };

    applyEncryptedMiddleware(this, 'ABDFN_SUITE', unitId, suiteConfig, () => ABDFNSuiteDB._keyProvider());
    
    // Schema Era 6+ (Phase 18)
    this.version(12).stores({
      presets_v6: 'id, name, gawebConfig.active, updatedAt',
      lettertemplates_v6: 'id, name, type, isActive, updatedAt',
      lettermappings_v6: 'id, name, templateId, etlPresetId, isActive, updatedAt',
      golden_tests_v6: 'id, templateId, mappingId, etlPresetId, codDocumento, version',
      audit_history_v6: 'id, timestamp, category, module, action, status',
      gaweb_golden_profiles_v6: 'id, codigoDocumento, formatoCarta, active',
      doc_catalog_v1: 'id, codigoDocumento, name, isActive, updatedAt'
    });

    this.presets_v6 = this.table('presets_v6');
    this.lettertemplates_v6 = this.table('lettertemplates_v6');
    this.lettermappings_v6 = this.table('lettermappings_v6');
    this.golden_tests_v6 = this.table('golden_tests_v6');
    this.audit_history_v6 = this.table('audit_history_v6');
    this.gaweb_golden_profiles_v6 = this.table('gaweb_golden_profiles_v6');
    this.doc_catalog_v1 = this.table('doc_catalog_v1');
  }

  /**
   * Set global key provider for all suite database instances
   */
  public static setKeyProvider(provider: () => CryptoKey | null) {
      this._keyProvider = provider;
  }
}

// Internal reference for the active workspace DB
let activeDbInstance: ABDFNSuiteDB | null = null;

/**
 * Sets the active unit database.
 * Closes the previous one if it exists to prevent contamination.
 */
export async function setActiveUnit(unitId: string): Promise<ABDFNSuiteDB> {
  if (activeDbInstance) {
    activeDbInstance.close();
  }
  activeDbInstance = new ABDFNSuiteDB(unitId);
  await activeDbInstance.open();
  return activeDbInstance;
}

/**
 * DB PROXY (Industrial Logic)
 * Intercepts property access and redirects to the active instance.
 * Allows components to do `import { db } from ...` without refactoring.
 */
export const db = new Proxy({} as ABDFNSuiteDB, {
  get: (_, prop) => {
    if (!activeDbInstance) {
       // On clean starts (Bootstrap), we allow calling getUnitDb later
       return undefined;
    }
    return (activeDbInstance as any)[prop];
  }
});
