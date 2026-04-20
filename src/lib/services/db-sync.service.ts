import { db } from '../db/db';
import { SuiteDump, LetterTemplateDump } from '../types/dump.types';

/**
 * Industrial Utility for Full Database Export/Import (Era 6)
 * Handles binary DOCX content conversion to Base64 for JSON portability.
 */
export class DbSyncService {
  
  /**
   * Generates a single JSON Blob containing the entire application state.
   */
  static async exportSuite(): Promise<Blob> {
    const [presets, templates, mappings, goldenTests, auditHistory] = await Promise.all([
      db.presets_v6.toArray(),
      db.lettertemplates_v6.toArray(),
      db.lettermappings_v6.toArray(),
      db.golden_tests_v6.toArray(),
      db.audit_history_v6.toArray(),
    ]);

    // Handle Binary Content (DOCX)
    const templatesWithBase64: LetterTemplateDump[] = await Promise.all(
      templates.map(async (tpl) => {
        const { binaryContent, ...rest } = tpl;
        const dump: LetterTemplateDump = { ...rest };
        
        if (binaryContent) {
          dump.binaryBase64 = this.arrayBufferToBase64(binaryContent);
        }
        
        return dump;
      })
    );

    const dump: SuiteDump = {
      version: 'abdfn-suite-v6',
      generatedAt: new Date().toISOString(),
      presets: presets as any,
      templates: templatesWithBase64,
      mappings: mappings as any,
      goldenTests: goldenTests as any,
      auditHistory: auditHistory as any,
    };

    return new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
  }

  /**
   * Imports a SuiteDump JSON into the local IndexedDB with industrial reconciliation.
   */
  static async importSuite(file: File, mode: 'REPLACE' | 'MERGE' = 'MERGE'): Promise<void> {
    const text = await file.text();
    const dump: SuiteDump = JSON.parse(text);

    if (dump.version !== 'abdfn-suite-v6') {
      throw new Error('VERSION_MISMATCH: Unsupported dump version');
    }

    // Transaction for industrial integrity
    await db.transaction('readwrite', [
      db.presets_v6, 
      db.lettertemplates_v6, 
      db.lettermappings_v6, 
      db.golden_tests_v6, 
      db.audit_history_v6
    ], async () => {
      
      if (mode === 'REPLACE') {
        await Promise.all([
          db.presets_v6.clear(),
          db.lettertemplates_v6.clear(),
          db.lettermappings_v6.clear(),
          db.golden_tests_v6.clear(),
          db.audit_history_v6.clear(),
        ]);
      }

      const reconcile = async (table: any, incoming: any) => {
        if (mode === 'REPLACE') {
          await table.put(incoming);
          return;
        }
        
        const existing = await table.get(incoming.id);
        if (!existing || (incoming.updatedAt && incoming.updatedAt > (existing.updatedAt || 0))) {
          await table.put(incoming);
        }
      };

      // 1. Presets
      for (const p of dump.presets) {
        await reconcile(db.presets_v6, p);
      }

      // 2. Templates (Recover binary DOCX)
      for (const t of dump.templates) {
        const { binaryBase64, ...rest } = t;
        const record: any = { ...rest };
        
        if (binaryBase64) {
          record.binaryContent = this.base64ToArrayBuffer(binaryBase64);
        }
        
        await reconcile(db.lettertemplates_v6, record);
      }

      // 3. Mappings
      for (const m of dump.mappings) {
        await reconcile(db.lettermappings_v6, m);
      }

      // 4. Goldens
      if (dump.goldenTests) {
        for (const g of dump.goldenTests) {
          await reconcile(db.golden_tests_v6, g);
        }
      }

      // 5. History
      if (dump.auditHistory) {
        for (const h of dump.auditHistory) {
          await reconcile(db.audit_history_v6, h);
        }
      }
    });

    console.log(`[ABDFN-SYNC] Import completed successfully. Mode: ${mode}`);
  }

  /**
   * Helper: ArrayBuffer -> Base64
   */
  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Helper: Base64 -> ArrayBuffer
   */
  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
