import { db } from '../db/db';
import { SuiteDump, LetterTemplateDump } from '../types/dump.types';
import { auditService } from './AuditService';

/**
 * Industrial Utility for Full Database Export/Import (Era 6)
 * Handles binary DOCX content conversion to Base64 for JSON portability.
 * Endured with Phase 13 Security: AES-GCM Encryption + PBKDF2 Key Derivation.
 */
export class DbSyncService {
  
  private static SYNC_VERSION = 'abdfn-v6-crypto';
  private static ITERATIONS = 100000;

  /**
   * Generates an encrypted JSON Blob.
   */
  static async exportSuite(passphrase: string, actorId: string): Promise<Blob> {
    const [presets, templates, mappings, goldenTests, auditHistory] = await Promise.all([
      db.presets_v6.toArray(),
      db.lettertemplates_v6.toArray(),
      db.lettermappings_v6.toArray(),
      db.golden_tests_v6.toArray(),
      db.audit_history_v6.toArray(),
    ]);

    await auditService.log({
      module: 'SUPERVISOR',
      messageKey: 'sync.export.start',
      status: 'INFO',
      operatorId: actorId,
      details: {
        eventType: 'SYNC_EXPORT_START',
        entityType: 'SYNC',
        actorId,
        severity: 'INFO',
        context: { presets: presets.length, templates: templates.length }
      }
    });

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

    const clearPayload: SuiteDump = {
      version: 'abdfn-suite-v6',
      generatedAt: new Date().toISOString(),
      presets: presets,
      templates: templatesWithBase64,
      mappings: mappings,
      goldenTests: goldenTests || [],
      auditHistory: auditHistory || [],
    };

    const encryptedContainer = await this.encrypt(JSON.stringify(clearPayload), passphrase);
    
    await auditService.log({
      module: 'SUPERVISOR',
      messageKey: 'sync.export.success',
      status: 'SUCCESS',
      operatorId: actorId,
      details: {
        eventType: 'SYNC_EXPORT_SUCCESS',
        entityType: 'SYNC',
        actorId,
        severity: 'INFO',
        context: { version: this.SYNC_VERSION }
      }
    });

    return new Blob([JSON.stringify(encryptedContainer, null, 2)], { type: 'application/octet-stream' });
  }

  /**
   * Imports an encrypted SuiteDump JSON into the local IndexedDB.
   */
  static async importSuite(file: File, passphrase: string, actorId: string, mode: 'REPLACE' | 'MERGE' = 'MERGE'): Promise<void> {
    const containerText = await file.text();
    const container = JSON.parse(containerText);

    if (container.version !== this.SYNC_VERSION) {
      throw new Error('VERSION_MISMATCH: Unsupported sync format');
    }

    await auditService.log({
      module: 'SUPERVISOR',
      messageKey: 'sync.import.attempt',
      status: 'INFO',
      operatorId: actorId,
      details: {
        eventType: 'SYNC_IMPORT_ATTEMPT',
        entityType: 'SYNC',
        entityId: file.name,
        actorId,
        severity: 'INFO',
        context: { mode, size: file.size }
      }
    });

    let clearJson: string;
    try {
      clearJson = await this.decrypt(container, passphrase);
    } catch (err) {
      await auditService.log({
        module: 'SECURITY',
        messageKey: 'sync.import.fail_crypto',
        status: 'ERROR',
        operatorId: actorId,
        details: {
          eventType: 'SYNC_IMPORT_FAIL',
          entityType: 'SYNC',
          severity: 'CRITICAL',
          context: { reason: 'DECRYPTION_FAILED' }
        }
      });
      throw new Error('DECRYPTION_FAILED: Invalid passphrase or corrupted file');
    }

    const dump: SuiteDump = JSON.parse(clearJson);
    if (dump.version !== 'abdfn-suite-v6') {
      throw new Error('PAYLOAD_MISMATCH: Invalid internal dump version');
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

      const reconcile = async (table: any, incoming: { id?: string | number, updatedAt?: number }) => {
        if (mode === 'REPLACE') {
          await table.put(incoming);
          return;
        }
        const existing = await table.get(incoming.id);
        if (!existing || (incoming.updatedAt && incoming.updatedAt > (existing.updatedAt || 0))) {
          await table.put(incoming);
        }
      };

      for (const p of dump.presets) await reconcile(db.presets_v6, p);
      for (const t of dump.templates) {
        const { binaryBase64, ...rest } = t;
        const record: any = { ...rest };
        if (binaryBase64) record.binaryContent = this.base64ToArrayBuffer(binaryBase64);
        await reconcile(db.lettertemplates_v6, record);
      }
      for (const m of dump.mappings) await reconcile(db.lettermappings_v6, m);
      if (dump.goldenTests) for (const g of dump.goldenTests) await reconcile(db.golden_tests_v6, g);
      if (dump.auditHistory) for (const h of dump.auditHistory) await reconcile(db.audit_history_v6, h);
    });

    await auditService.log({
      module: 'SUPERVISOR',
      messageKey: 'sync.import.success',
      status: 'SUCCESS',
      operatorId: actorId,
      details: {
        eventType: 'SYNC_IMPORT_SUCCESS',
        entityType: 'SYNC',
        actorId,
        severity: 'INFO',
        context: { mode }
      }
    });

    console.log(`[ABDFN-SYNC] Import completed successfully. Mode: ${mode}`);
  }

  // --- CRYPTO HELPERS (WEB CRYPTO API) ---

  private static async deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const baseKey = await crypto.subtle.importKey(
      'raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']
    );
    return await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: this.ITERATIONS, hash: 'SHA-256' } as Pbkdf2Params,
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  private static async encrypt(text: string, passphrase: string) {
    const enc = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await this.deriveKey(passphrase, salt);

    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv }, key, enc.encode(text)
    );

    return {
      version: this.SYNC_VERSION,
      kdf: 'PBKDF2-SHA256',
      iterations: this.ITERATIONS,
      salt: this.arrayBufferToBase64(salt.buffer),
      iv: this.arrayBufferToBase64(iv.buffer),
      ciphertext: this.arrayBufferToBase64(ciphertext)
    };
  }

  private static async decrypt(container: any, passphrase: string): Promise<string> {
    const dec = new TextDecoder();
    const salt = this.base64ToArrayBuffer(container.salt);
    const iv = this.base64ToArrayBuffer(container.iv);
    const ciphertext = this.base64ToArrayBuffer(container.ciphertext);
    const key = await this.deriveKey(passphrase, new Uint8Array(salt));

    const clearBuf = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(iv) }, key, ciphertext
    );
    return dec.decode(clearBuf);
  }

  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
