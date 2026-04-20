/**
 * ABDFN Unified Suite - Auth & Workspace Types (Phase 8)
 */

export type OperatorRole = 'ADMIN' | 'TECH' | 'OPERATOR';

/**
 * Capability-based Permission System
 */
export type Capability = 
  // CRYPT
  | 'CRYPT_USE'
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
  | 'SETTINGS_GLOBAL';

export type AuditModule =
  | 'CRYPT'
  | 'ETL'
  | 'LETTER'
  | 'AUDIT'
  | 'SUPERVISOR'
  | 'SECURITY'
  | 'SYSTEM';

export interface AuditRecord {
  id?: string;
  timestamp: number;
  module: AuditModule;
  messageKey: string;
  details?: Record<string, string | number | boolean>;
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
  name: string;        // Display Name
  username: string;    // Industrial Identifier
  pinHash: string;     // Hashed PIN
  role: OperatorRole;
  unitIds: string[];   // Assigned units
  createdAt: number;
  updatedAt: number;
  isActive: number;     // 1 for true, 0 for false
  isMaster?: boolean;   // Protected root operator
  mfaEnabled: boolean;  // MFA status
  mfaSecret?: string;   // Encrypted Base32 secret for TOTP
}

export interface AuthSession {
  operatorId: string;
  unitId: string;
  lastLoginAt: number;
  mfaStep: number;      // 0: Initial, 1: PIN_OK, 2: MFA_OK
}
