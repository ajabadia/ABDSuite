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
import { UserRole, Capability, Operator } from '../types/auth.types';

const ROLE_CAPABILITIES: Record<UserRole, Capability[]> = {
  ADMIN: [
    // CRYPT
    'CRYPT_USE',
    'CRYPT_RUN',
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
  ]
};

export const PermissionsService = {
  /**
   * Simple authority check based solely on role (Legacy/Base)
   */
  hasCapability(role: UserRole | null | undefined, cap: Capability): boolean {
    if (!role) return false;
    return ROLE_CAPABILITIES[role]?.includes(cap) ?? false;
  },

  /**
   * Returns only the base capabilities for a given role (Phase 12.1)
   */
  baseCapabilitiesForRole(role: UserRole | null | undefined): Capability[] {
    if (!role) return [];
    return ROLE_CAPABILITIES[role] ?? [];
  },

  /**
   * Advanced authority check with Overrides (Phase 12.1)
   * PRECENDENCE RULE: Denied Capabilities > (Base Role Capabilities OR Extra Capabilities).
   */
  hasCapabilityForOperator(operator: Operator | null | undefined, cap: Capability): boolean {
    if (!operator) return false;

    // 1. Explicit Denial (Hard override)
    const denied = operator.deniedCapabilities || [];
    if (denied.includes(cap)) return false;

    // 2. Base Role Power
    const base = this.baseCapabilitiesForRole(operator.role);
    if (base.includes(cap)) return true;

    // 3. Extra Capabilities (Promoted override)
    const extra = operator.extraCapabilities || [];
    if (extra.includes(cap)) return true;

    return false;
  }
};
