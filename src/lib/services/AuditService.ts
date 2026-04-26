import { coreDb } from '../db/SystemDB';
import { db } from '../db/db';
import { AuditRecord, AuditDetails } from '../types/auth.types';
import { resolveAuditCategory } from '../types/audit.types';

/**
 * Unified Audit Service (Industrial Era 6.5)
 * Orchestrates logging with Deferred Persistence Queue for high-availability.
 */
class AuditService {
  private static pendingLogs: AuditRecord[] = [];
  private static isFlushing = false;

  /**
   * Main logging method.
   * Redirects to Core or Unit, with enqueuing fallback.
   */
  async log(record: Omit<AuditRecord, 'id' | 'timestamp'>) {
    const entry: AuditRecord = {
      ...record,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };

    // Try to flush pending logs whenever a new log arrives
    this.flushPendingLogs();

    try {
      const category = resolveAuditCategory(entry.messageKey);

      if (
        entry.module === 'SECURITY' || 
        entry.module === 'SYSTEM' || 
        entry.module === 'SUPERVISOR' || 
        entry.module === 'REGTECH'
      ) {
        // Global Audit (CoreDB - Non-Encrypted Table)
        // CRITICAL: Mask PII before global persistence
        const sanitizedDetails = this.maskSensitiveData(entry.details || {});
        const detailsJson = JSON.stringify(sanitizedDetails);

        await coreDb.system_log.add({
          id: entry.id!,
          timestamp: entry.timestamp,
          category,
          action: entry.messageKey,
          status: entry.status,
          details: detailsJson
        });
        console.log(`[AUDIT-CORE-SUCCESS] ${entry.module}.${entry.messageKey}`);
      } else {
        // Operational Audit (UnitDB - Encrypted at-rest)
        const detailsJson = JSON.stringify(entry.details || {});
        if (db && (db as any).audit_history_v6) {
          await db.audit_history_v6.add({
            id: entry.id!,
            timestamp: entry.timestamp,
            category,
            module: entry.module as any,
            action: entry.messageKey,
            status: entry.status as any,
            details: detailsJson
          });
          console.log(`[AUDIT-UNIT-SUCCESS] ${entry.module}.${entry.messageKey}`);
        } else {
          console.warn(`[AUDIT-COLLECTOR] Unit DB not ready. Enqueueing: ${entry.messageKey}`);
          AuditService.pendingLogs.push(entry);
        }
      }
    } catch (err) {
      console.error('[AUDIT-SERVICE] Failed to handle log event', err, entry);
    }
  }

  /**
   * Industrial PII Safeguard (ERA 6.1)
   * Recursively masks sensitive fields for non-encrypted stores.
   */
  private maskSensitiveData(data: any): any {
    if (!data || typeof data !== 'object') return data;
    
    const SENSITIVE_KEYS = ['tin', 'nif', 'ssn', 'email', 'phone', 'birthDate', 'firstName', 'lastName'];
    const result = Array.isArray(data) ? [...data] : { ...data };

    for (const key in result) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.includes(lowerKey) || SENSITIVE_KEYS.some(k => lowerKey.includes(k))) {
        if (typeof result[key] === 'string' && result[key].length > 4) {
          result[key] = `${result[key].substring(0, 3)}***`;
        } else {
          result[key] = '***';
        }
      } else if (typeof result[key] === 'object') {
        result[key] = this.maskSensitiveData(result[key]);
      }
    }
    return result;
  }

  /**
   * Attempts to persist queued logs into the Unit Database.
   */
  private async flushPendingLogs() {
    if (AuditService.isFlushing || AuditService.pendingLogs.length === 0) return;
    
    // Check if Unit DB is actually reachable via the Proxy
    const unitDb = db as any;
    if (!unitDb || !unitDb.audit_history_v6) return;

    AuditService.isFlushing = true;
    console.log(`[AUDIT-COLLECTOR] Initialization detected. Flushing ${AuditService.pendingLogs.length} enqueued logs...`);

    const queue = [...AuditService.pendingLogs];
    AuditService.pendingLogs = [];

    for (const entry of queue) {
      try {
        const detailsJson = JSON.stringify(entry.details || {});
        const category = resolveAuditCategory(entry.messageKey);

        await unitDb.audit_history_v6.add({
          id: entry.id!,
          timestamp: entry.timestamp,
          category,
          module: entry.module as any,
          action: entry.messageKey,
          status: entry.status as any,
          details: detailsJson
        });
      } catch (err) {
        console.error('[AUDIT-COLLECTOR] Flush failure for entry. Re-queueing.', err, entry);
        AuditService.pendingLogs.push(entry);
      }
    }

    const remaining = AuditService.pendingLogs.length;
    AuditService.isFlushing = false;
    
    if (remaining === 0) {
        console.log('[AUDIT-COLLECTOR] Persistence queue cleared. Industrial sync complete.');
    } else {
        console.warn(`[AUDIT-COLLECTOR] Persistence partial. ${remaining} logs remaining in queue.`);
    }
  }

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
