/**
 * @purpose Proporciona un arreglo de enlaces de sidebar filtrados basado en el estado de sesión del usuario, su rol y estatus de autenticación.
 * @purpose_en Builds a filtered sidebar link array based on the user's session state, role, and authentication status.
 * @refactorable false
 * @classification Helper Utility
 * @complexity Low
 * @fingerprint exports:3,imports:1,sig:kq5xf1
 * @lastUpdated 2026-06-23T23:01:39.722Z
 */

import type { ReactNode } from 'react';

/**
 * A link definition with optional role/permission requirements.
 * Extends the base `SidebarLink` shape from @ajabadia/styles with RBAC fields.
 */
export interface NavLinkConfig {
  href: string;
  label: string;
  icon: ReactNode;
  /** Only show when the user is logged in */
  requiresAuth?: boolean;
  /** Only show when the user has ADMIN or SUPER_ADMIN role */
  requiresAdmin?: boolean;
  /** Only show when the user has SUPER_ADMIN role */
  requiresSuperAdmin?: boolean;
}

export interface SidebarBuildResult {
  href: string;
  label: string;
  icon: ReactNode;
}

/**
 * Build a filtered sidebar link array based on the user's session state.
 *
 * - Links with `requiresSuperAdmin` are only included if role === 'SUPER_ADMIN'
 * - Links with `requiresAdmin` are only included if role is ADMIN, PROFESSOR, or SUPER_ADMIN
 * - Links with `requiresAuth` are only included if the user is logged in
 *
 * @param configs - All possible link definitions
 * @param role    - The current user's role (e.g. 'USER' | 'ADMIN' | 'PROFESSOR' | 'SUPER_ADMIN')
 * @param isLoggedIn - Whether the user is authenticated
 */
export function buildSidebarLinks(
  configs: readonly NavLinkConfig[],
  role?: string,
  isLoggedIn = false,
): SidebarBuildResult[] {
  const roleUpper = role?.toUpperCase() ?? '';

  return configs.filter((link) => {
    if (link.requiresSuperAdmin) return roleUpper === 'SUPER_ADMIN';
    if (link.requiresAdmin) return roleUpper === 'ADMIN' || roleUpper === 'PROFESSOR' || roleUpper === 'SUPER_ADMIN';
    if (link.requiresAuth) return isLoggedIn;
    return true; // public link
  });
}
