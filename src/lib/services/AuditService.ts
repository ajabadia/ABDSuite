import { coreDb } from '../db/SystemDB';
import { db } from '../db/db';
import { AuditRecord, AuditDetails } from '../types/auth.types';

/**
 * Unified Audit Service (Phase 11.2)
 * Orchestrates logging between Global (Core) and Operational (Unit) registries.
 */
class AuditService {
  /**
   * Main logging method.
   * Redirects to Core for SECURITY/SYSTEM/SUPERVISOR events, or Unit for others.
   */
  async log(record: Omit<AuditRecord, 'id' | 'timestamp'>) {
    const entry: AuditRecord = {
      ...record,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };

    try {
      const detailsJson = JSON.stringify(entry.details || {});

      if (entry.module === 'SECURITY' || entry.module === 'SYSTEM' || entry.module === 'SUPERVISOR') {
        // Global Audit (CoreDB)
        await coreDb.system_log.add({
          id: entry.id!,
          timestamp: entry.timestamp,
          action: entry.messageKey,
          status: entry.status,
          details: detailsJson
        });
        console.log(`[AUDIT-CORE] ${entry.module} - ${entry.messageKey}`, entry.details);
      } else {
        // Operational Audit (UnitDB)
        if (db && (db as any).audit_history_v6) {
          await db.audit_history_v6.add({
            id: entry.id!,
            timestamp: entry.timestamp,
            module: entry.module as any,
            action: entry.messageKey,
            status: entry.status as any,
            details: detailsJson
          });
          console.log(`[AUDIT-UNIT] ${entry.module} - ${entry.messageKey}`, entry.details);
        } else {
          console.warn('[AUDIT-SERVICE] Unit DB not available for logging operational event:', entry);
        }
      }
    } catch (err) {
      console.error('[AUDIT-SERVICE] Failed to log event', err, entry);
    }
  }

  /**
   * Helper for security events
   */
  async logSecurity(messageKey: string, details: AuditDetails, operatorId?: string) {
    await this.log({
      module: 'SECURITY',
      messageKey,
      details,
      status: details.severity === 'CRITICAL' ? 'WARNING' : 'INFO',
      operatorId
    });
  }
}

export const auditService = new AuditService();
