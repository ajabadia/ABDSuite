import { db } from '../db/db';
import { loadAuditRetention } from './audit-retention-settings';

/**
 * Purges old audit records based on the user-defined retention period.
 * Maintains Industrial standards for database performance.
 */
export async function purgeOldAuditRecords() {
  const { months } = loadAuditRetention();
  const now = new Date();
  
  // Calculate the cutoff timestamp
  const cutoff = new Date(
    now.getFullYear(),
    now.getMonth() - (months - 1),
    1
  ).getTime();

  try {
    const deletedCount = await db.audit_history_v6
      .where('timestamp')
      .below(cutoff)
      .delete();
    
    if (deletedCount > 0) {
      console.log(`[ABDFN-RETENTION] Auto-purged ${deletedCount} legacy audit records (Retention: ${months}m).`);
    }
  } catch (e) {
    console.error('Failed to purge old audit records', e);
  }
}
