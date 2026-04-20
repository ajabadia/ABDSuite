/**
 * EncryptionMigration - Maintenance utility for at-rest encryption (Phase 14).
 * Migrates existing plain-text records to encrypted containers.
 */

import { coreDb } from '../db/SystemDB';
import { ABDFNSuiteDB } from '../db/db';
import { CryptoService } from '../services/crypto.service';

export class EncryptionMigration {
  
  /**
   * Migrates core records (Operators mfaSecret).
   */
  public static async migrateCore(installationKey: CryptoKey): Promise<{ success: number; skipped: number }> {
    let success = 0;
    let skipped = 0;

    await coreDb.operators.toCollection().each(async (op: any) => {
      // 1. Skip if already encrypted or empty
      if (!op.mfaSecret || (typeof op.mfaSecret === 'object' && (op.mfaSecret as any).v === 1)) {
        skipped++;
        return;
      }

      // 2. Encrypt
      try {
        const aad = CryptoService.buildAAD('ABDFN_CORE', null, 'operators', op.id, 'mfaSecret');
        op.mfaSecret = await CryptoService.encryptField(op.mfaSecret, installationKey, aad);
        await coreDb.operators.put(op);
        success++;
      } catch (err) {
        console.error(`[MIGRATION-CORE] Failed to encrypt mfaSecret for ${op.username}`, err);
      }
    });

    return { success, skipped };
  }

  /**
   * Migrates unit-specific records (Templates, Audits).
   */
  public static async migrateUnit(
      db: ABDFNSuiteDB, 
      unitId: string, 
      installationKey: CryptoKey
  ): Promise<{ success: number; skipped: number }> {
    let success = 0;
    let skipped = 0;

    // Migrate Templates
    await db.lettertemplates_v6.toCollection().each(async (tmpl: any) => {
        let modified = false;

        // Content (HTML)
        if (tmpl.content && (typeof tmpl.content !== 'object' || (tmpl.content as any).v !== 1)) {
            const aad = CryptoService.buildAAD('ABDFN_SUITE', unitId, 'lettertemplates_v6', tmpl.id, 'content');
            tmpl.content = await CryptoService.encryptField(tmpl.content, installationKey, aad);
            modified = true;
        }

        // BinaryContent (DOCX)
        if (tmpl.binaryContent && (typeof tmpl.binaryContent !== 'object' || (tmpl.binaryContent as any).v !== 1)) {
            const aad = CryptoService.buildAAD('ABDFN_SUITE', unitId, 'lettertemplates_v6', tmpl.id, 'binaryContent');
            tmpl.binaryContent = await CryptoService.encryptField(tmpl.binaryContent, installationKey, aad);
            modified = true;
        }

        if (modified) {
            await db.lettertemplates_v6.put(tmpl);
            success++; 
        } else {
            skipped++;
        }
    });

    // Migrate Audit History
    await db.audit_history_v6.toCollection().each(async (rec: any) => {
        if (rec.details && (typeof rec.details !== 'object' || (rec.details as any).v !== 1)) {
            const aad = CryptoService.buildAAD('ABDFN_SUITE', unitId, 'audit_history_v6', rec.id, 'details');
            rec.details = await CryptoService.encryptField(rec.details, installationKey, aad);
            await db.audit_history_v6.put(rec);
            success++;
        } else {
            skipped++;
        }
    });

    return { success, skipped };
  }
}
