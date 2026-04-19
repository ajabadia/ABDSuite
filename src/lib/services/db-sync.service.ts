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
   * Imports a SuiteDump JSON into the local IndexedDB.
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

      // 1. Presets
      for (const p of dump.presets) {
        await db.presets_v6.put(p); // put = update if exists, add if not
      }

      // 2. Templates (Recover binary DOCX)
      for (const t of dump.templates) {
        const { binaryBase64, ...rest } = t;
        const record: any = { ...rest };
        
        if (binaryBase64) {
          record.binaryContent = this.base64ToArrayBuffer(binaryBase64);
        }
        
        await db.lettertemplates_v6.put(record);
      }

      // 3. Mappings
      for (const m of dump.mappings) {
        await db.lettermappings_v6.put(m);
      }

      // 4. Goldens
      if (dump.goldenTests) {
        for (const g of dump.goldenTests) {
          await db.golden_tests_v6.put(g);
        }
      }

      // 5. History
      if (dump.auditHistory) {
        for (const h of dump.auditHistory) {
          await db.audit_history_v6.put(h);
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
