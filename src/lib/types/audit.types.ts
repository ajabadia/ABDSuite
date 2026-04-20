/**
 * ABDFN Unified Suite - Industrial Audit Taxonomy (Phase 14.3)
 * Centralizes categories, mapping and types for global and unit-level auditing.
 */

export type AuditCategory = 'AUTH' | 'RBAC' | 'CONFIG' | 'DATA' | 'SYSTEM';

export type AuditSeverity = 'INFO' | 'WARN' | 'CRITICAL';

export type AuditStatus = 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO';

export interface UnifiedAuditDetails {
  eventType: string;
  entityType: string;
  entityId?: string;
  actorId?: string;
  actorUser?: string;
  severity?: AuditSeverity;
  context?: Record<string, string | number | boolean | null>;
}

export interface UnifiedAuditRecord {
  id: string;
  timestamp: number;
  category: AuditCategory;
  module: string;
  action: string;      // The messageKey/eventType
  status: AuditStatus;
  operatorId?: string;
  details?: string;    // JSON string for persistence
}

/**
 * Event-to-Category Mapping
 * Ensures consistency across the Suite for indexing and KPIs.
 */
export const EVENT_CATEGORY_MAP: Record<string, AuditCategory> = {
  // AUTH (Authentication, MFA, Sessions)
  AUTHLOGINSUCCESS: 'AUTH',
  AUTHLOGINFAILURE: 'AUTH',
  AUTHMFASUCCESS: 'AUTH',
  AUTHMFAFAILURE: 'AUTH',
  AUTHLOCKOUTPIN: 'AUTH',
  AUTHSESSIONLOCK: 'AUTH',
  AUTHSESSIONUNLOCK: 'AUTH',
  AUTHSESSIONEXPIRE: 'AUTH',

  // RBAC (Operators, Roles, Permissions)
  OPERATORCREATE: 'RBAC',
  OPERATOREDIT: 'RBAC',
  OPERATORDEACTIVATE: 'RBAC',
  OPERATORROLECHANGE: 'RBAC',
  OPERATORMASTERTRANSFER: 'RBAC',
  OPERATORCAPABILITYOVERRIDE: 'RBAC',
  OPERATORPINRESET: 'RBAC',
  OPERATORMFARESET: 'RBAC',

  // CONFIG (Global settings, Security, Encryption, Module updates)
  CONFIGTELEMETRYUPDATE: 'CONFIG',
  CONFIGSECURITYUPDATE: 'CONFIG',
  CONFIGETLUPDATE: 'CONFIG',
  CONFIGLETTERUPDATE: 'CONFIG',
  CONFIGCRYPTUPDATE: 'CONFIG',
  CONFIGAUDITUPDATE: 'CONFIG',
  CRYPTOIKUNLOCK: 'CONFIG',
  CRYPTOIKREWRAP: 'CONFIG',
  CRYPTOIKLOCK: 'CONFIG',
  AUDITCONFIGUPDATE: 'CONFIG',

  // DATA (IO, Sync, Migration, Processing)
  DATADUMPEXPORTSTART: 'DATA',
  DATADUMPEXPORTEND: 'DATA',
  DATADUMPIMPORTSTART: 'DATA',
  DATADUMPIMPORTEND: 'DATA',
  DATADUMPSECURITYLOCKED: 'DATA',
  SYNCEXPORTSTART: 'DATA',
  SYNCEXPORTEND: 'DATA',
  SYNCIMPORTSTART: 'DATA',
  SYNCIMPORTEND: 'DATA',
  DATAATRESTMIGRATIONSTART: 'DATA',
  DATAATRESTMIGRATIONEND: 'DATA',
  CRYPTBATCHCOMPLETED: 'DATA',
  GAWEB_AUDIT_COMPLETED: 'DATA',
  LETTER_GEN_COMPLETED: 'DATA',

  // SYSTEM (Lifecycle, Maintenance, Purgues)
  SYSTEMSTART: 'SYSTEM',
  SYSTEMSHUTDOWN: 'SYSTEM',
  SYSTEMUPDATEVERSION: 'SYSTEM',
  RETENTIONPOLICYPURGE: 'SYSTEM',
  SYSTEMHEALTHWARN: 'SYSTEM',
};

export function resolveAuditCategory(eventType: string): AuditCategory {
  return EVENT_CATEGORY_MAP[eventType] ?? 'SYSTEM';
}
