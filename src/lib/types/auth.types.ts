/**
 * ABDFN Unified Suite - Auth & Workspace Types (Phase 8)
 */

export type OperatorRole = 'ADMIN' | 'TECH' | 'OPERATOR';

export interface WorkspaceUnit {
  id: string;          // UUID
  code: string;        // e.g., UNIT01
  name: string;
  createdAt: number;
  updatedAt: number;
  isActive: number;     // 1 for true, 0 for false (Industrial standard for IDB indexing)
}

export interface Operator {
  id: string;          // UUID
  name: string;
  pinHash: string;     // Hashed PIN
  role: OperatorRole;
  unitIds: string[];   // Assigned units
  createdAt: number;
  updatedAt: number;
  isActive: number;     // 1 for true, 0 for false
}

export interface AuthSession {
  operatorId: string;
  unitId: string;
  lastLoginAt: number;
}
