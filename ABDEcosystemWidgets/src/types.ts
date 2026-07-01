/**
 * @purpose Gestiona la estructura para registros de auditoría.
 * @purpose_en Defines the structure for audit log entries.
 * @refactorable false
 * @classification Type Definition
 * @complexity Low
 * @fingerprint exports:1,imports:0,sig:1u2z8wy
 * @lastUpdated 2026-06-21T14:27:31.218Z
 */

export interface AuditLog {
  _id?: string;
  appId?: string;
  action: string;
  entityId?: string;
  entityType?: string;
  createdAt?: string;
  userEmail?: string;
  changedFields?: Record<string, unknown>;
  previousState?: Record<string, unknown>;
  [key: string]: unknown;
}
