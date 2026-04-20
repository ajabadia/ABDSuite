/**
 * ABDFN Unified Suite - Auth & Workspace Types (Phase 8)
 */

export type UserRole = 'ADMIN' | 'TECH' | 'OPERATOR';
export type OperatorRole = UserRole; 
export type AuditModule = 'AUTH' | 'ETL' | 'LETTER' | 'SYNC' | 'SYSTEM' | 'SECURITY' | 'SUPERVISOR' | 'AUDIT' | 'CRYPT';

/**
 * Capability-based Permission System
 */
export type Capability = 
  // CRYPT
  | 'CRYPT_USE'
  | 'CRYPT_RUN'
  | 'CRYPT_CONFIG_GLOBAL'
  // ETL
  | 'ETL_VIEW'
  | 'ETL_EDIT_PRESETS'
  | 'ETL_RUN'
  | 'ETL_CONFIG_GLOBAL'
  // LETTER
  | 'LETTER_VIEW'
  | 'LETTER_EDIT_TEMPLATES'
  | 'LETTER_EDIT_MAPPINGS'
  | 'LETTER_GENERATE'
  | 'LETTER_CONFIG_GLOBAL'
  // AUDIT
  | 'AUDIT_VIEW'
  | 'AUDIT_RUN'
  | 'AUDIT_CONFIG'
  // SUPERVISOR / SECURITY / SETTINGS
  | 'SUPERVISOR_VIEW'
  | 'OPERATORS_MANAGE'
  | 'SETTINGS_GLOBAL'
  | 'SYNC_EXPORT'
  | 'SYNC_IMPORT';

/**
 * Structured details for Industrial Audit (Phase 11.2)
 */
export interface AuditDetails {
  eventType: string;
  entityType: string;
  entityId?: string;
  actorId?: string;
  actorUser?: string;
  severity?: 'INFO' | 'WARN' | 'CRITICAL';
  context?: Record<string, string | number | boolean | null>;
}

export interface AuditRecord {
  id?: string;
  timestamp: number;
  module: AuditModule;
  messageKey: string;
  details?: AuditDetails;
  status: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO';
  operatorId?: string;
}

export interface WorkspaceUnit {
  id: string;          // UUID
  code: string;        // e.g., UNIT01
  name: string;
  createdAt: number;
  updatedAt: number;
  isActive: number;     // 1 for true, 0 for false
}

export interface Operator {
  id: string;          // UUID
  displayName: string; // Display Name
  username: string;    // Industrial Identifier
  pinHash: string;     // Hashed PIN
  role: UserRole;
  unitIds: string[];   // Assigned units
  createdAt: number;
  updatedAt: number;
  lastLogin?: number;  // Last successful access
  isActive: number;     // 1 for true, 0 for false
  isMaster?: boolean;   // Protected root operator
  mfaEnabled: boolean;  // MFA status
  mfaSecret?: string;   // Encrypted Base32 secret for TOTP
  
  // Capability Overrides (Phase 12.1)
  extraCapabilities?: Capability[];
  deniedCapabilities?: Capability[];

  // Security Hardening (Phase 13)
  failedPinAttempts?: number;
  failedMfaAttempts?: number;
  mfaLockedUntil?: number;
  mfaVerifiedAt?: number; // Last time MFA was fully verified
}

export interface AuthSession {
  operatorId: string;
  unitId: string;
  lastLoginAt: number;
  lastActivityAt: number;   // Timestamp de última interacción (heartbeat)
  expiresAt: number;        // Timestamp de expiración absoluta de sesión
  mfaVerifiedAt: number | null; // Timestamp de última validación TOTP parcial
  mfaStep: number;          // 0: Initial, 1: PIN_OK, 2: MFA_OK
  authLevel: 1 | 2;         // 1: PIN, 2: PIN+MFA
}
