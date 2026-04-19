import Dexie, { type Table } from 'dexie';
import { EtlPreset } from '../types/etl.types';
import { LetterTemplate, LetterMapping } from '../types/letter.types';

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
  module: 'LETTER' | 'AUDIT' | 'CRYPT';
  action: string;
  details: string; // JSON string with counts, errors, etc.
  status: 'SUCCESS' | 'WARNING' | 'ERROR';
}

export class ABDFNSuiteDB extends Dexie {
  // Only expose v6 tables to the application core
  presets_v6!: Table<EtlPreset>;
  lettertemplates_v6!: Table<LetterTemplate>;
  lettermappings_v6!: Table<LetterMapping>;
  golden_tests_v6!: Table<GoldenTest>;
  audit_history_v6!: Table<AuditHistoryRecord>;

  // Legacy tables kept for migration
  presets_v5!: Table<any>;
  templates_v5!: Table<any>;
  mappings_v5!: Table<any>;

  constructor() {
    super('ABDFNSuiteDB');
    
    // v8: The legacy numerical structure (Last of the 5.x Era)
    this.version(8).stores({
      presets: '++id, name, gawebConfig.active, updatedAt',
      letter_templates: '++id, name, type, isActive, updatedAt',
      letter_mappings: '++id, name, templateId, etlPresetId, isActive, updatedAt',
      golden_tests: '++id, templateId, mappingId, etlPresetId, codDocumento, version',
      audit_history: '++id, timestamp, module, action, status'
    });

    // v9: Era 6 - The Industrial UUID Migration
    this.version(9).stores({
      presets_v6: 'id, name, gawebConfig.active, updatedAt',
      lettertemplates_v6: 'id, name, type, isActive, updatedAt',
      lettermappings_v6: 'id, name, templateId, etlPresetId, isActive, updatedAt',
      golden_tests_v6: 'id, templateId, mappingId, etlPresetId, codDocumento, version',
      audit_history_v6: 'id, timestamp, module, action, status'
    }).upgrade(async (tx) => {
        // --- INDUSTRIAL MIGRATION LOGIC (Legacy -> v6) ---
        const legacyPresets = tx.table('presets');
        const legacyTemplates = tx.table('letter_templates');
        const legacyMappings = tx.table('letter_mappings');

        const v6Presets = tx.table('presets_v6');
        const v6Templates = tx.table('lettertemplates_v6');
        const v6Mappings = tx.table('lettermappings_v6');

        const presetIdMap = new Map<number, string>();
        const templateIdMap = new Map<number, string>();

        console.log('[ABDFN-DB] Starting Era 6 Migration...');

        // 1. Presets Migration
        const oldPresets = await legacyPresets.toArray();
        if (oldPresets.length > 0) {
            const newPresets = oldPresets.map(p => {
                const oldId = p.id as number;
                const newId = crypto.randomUUID();
                presetIdMap.set(oldId, newId);
                return { ...p, id: newId };
            });
            await v6Presets.bulkAdd(newPresets);
            console.log(`[ABDFN-DB] Migrated ${newPresets.length} presets.`);
        }

        // 2. Templates Migration
        const oldTemplates = await legacyTemplates.toArray();
        if (oldTemplates.length > 0) {
            const newTemplates = oldTemplates.map(t => {
                const oldId = t.id as number;
                const newId = crypto.randomUUID();
                templateIdMap.set(oldId, newId);
                return { ...t, id: newId };
            });
            await v6Templates.bulkAdd(newTemplates);
            console.log(`[ABDFN-DB] Migrated ${newTemplates.length} templates.`);
        }

        // 3. Mappings Migration (Relational Re-mapping)
        const oldMappings = await legacyMappings.toArray();
        if (oldMappings.length > 0) {
            const newMappings = oldMappings.map(m => {
                const newId = crypto.randomUUID();
                const newTplId = templateIdMap.get(m.templateId as number);
                const newPresetId = presetIdMap.get(m.etlPresetId as number);
                return { 
                    ...m, 
                    id: newId, 
                    templateId: newTplId || m.templateId, 
                    etlPresetId: newPresetId || m.etlPresetId 
                };
            });
            await v6Mappings.bulkAdd(newMappings);
            console.log(`[ABDFN-DB] Migrated ${newMappings.length} mappings with re-mapped FKs.`);
        }

        console.log('[ABDFN-DB] Era 6 Migration successfully completed.');
    });

    // Assign table shortcuts for the v6 era
    this.presets_v6 = this.table('presets_v6');
    this.lettertemplates_v6 = this.table('lettertemplates_v6');
    this.lettermappings_v6 = this.table('lettermappings_v6');
    this.golden_tests_v6 = this.table('golden_tests_v6');
    this.audit_history_v6 = this.table('audit_history_v6');
  }
}

export const db = new ABDFNSuiteDB();
