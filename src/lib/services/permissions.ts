/**
 * Industrial Permissions Engine (Phase 11)
 * Decouples roles from capabilities for modular governance.
 * 
 * RBAC MODEL:
 * - Users -> Roles (ADMIN, TECH, OPERATOR)
 * - Roles -> Capabilities (e.g. LETTER_GENERATE, ETL_RUN, AUDIT_CONFIG)
 * - UI/Services consult hasCapability(role, cap) to decide access.
 * 
 * See full guide: docs/ROLES_AND_PERMISSIONS.md
 */
import { OperatorRole, Capability } from '../types/auth.types';

const ROLE_CAPABILITIES: Record<OperatorRole, Capability[]> = {
  ADMIN: [
    // CRYPT
    'CRYPT_USE',
    'CRYPT_CONFIG_GLOBAL',
    // ETL
    'ETL_VIEW',
    'ETL_EDIT_PRESETS',
    'ETL_RUN',
    'ETL_CONFIG_GLOBAL',
    // LETTER
    'LETTER_VIEW',
    'LETTER_EDIT_TEMPLATES',
    'LETTER_EDIT_MAPPINGS',
    'LETTER_GENERATE',
    'LETTER_CONFIG_GLOBAL',
    // AUDIT
    'AUDIT_VIEW',
    'AUDIT_RUN',
    'AUDIT_CONFIG',
    // SUPERVISOR / SETTINGS
    'SUPERVISOR_VIEW',
    'OPERATORS_MANAGE',
    'SETTINGS_GLOBAL',
  ],
  TECH: [
    // CRYPT
    'CRYPT_USE',
    // ETL
    'ETL_VIEW',
    'ETL_EDIT_PRESETS',
    'ETL_RUN',
    // LETTER
    'LETTER_VIEW',
    'LETTER_EDIT_TEMPLATES',
    'LETTER_EDIT_MAPPINGS',
    'LETTER_GENERATE',
    // AUDIT
    'AUDIT_VIEW',
    'AUDIT_RUN',
    'AUDIT_CONFIG',
    // SUPERVISOR
    'SUPERVISOR_VIEW',
    // No OPERATORS_MANAGE or SETTINGS_GLOBAL
  ],
  OPERATOR: [
    // CRYPT
    'CRYPT_USE',
    // ETL
    'ETL_VIEW',
    'ETL_RUN',
    // LETTER
    'LETTER_VIEW',
    'LETTER_GENERATE',
    // AUDIT
    'AUDIT_VIEW',
    'AUDIT_RUN',
    // No CONFIG_GLOBAL, EDITING of models, or SUPERVISOR
  ]
};

export const PermissionsService = {
  /**
   * Main authority check
   */
  hasCapability(role: OperatorRole | null | undefined, cap: Capability): boolean {
    if (!role) return false;
    return ROLE_CAPABILITIES[role]?.includes(cap) ?? false;
  }
};
