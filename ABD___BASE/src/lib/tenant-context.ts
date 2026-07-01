/**
 * @purpose Gestiona y resuelve el contexto del inquilino para una solicitud o página según la sesión y los parámetros de búsqueda, implementando un guardia de seguridad para prevenir ataques de IDOR.
 * @purpose_en Manages and resolves the tenant context for a request or page based on session and searchParams, implementing security guard to prevent IDOR attacks.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:1,imports:1,sig:g3i4i3
 * @lastUpdated 2026-06-23T22:36:39.988Z
 */

import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';

/**
 * Resolves the tenant context for a request or page based on session and searchParams.
 * Implements the security guard (Anti-IDOR):
 * - If the user is SUPER_ADMIN and queryTenantId is provided, returns that queryTenantId.
 * - Otherwise, returns the user's default session tenantId, ignoring any manipulated query params.
 */
type ResolvedSearchParams = URLSearchParams | Record<string, string | string[] | undefined>;

export async function resolveTenantContext(
  searchParams: ResolvedSearchParams | Promise<ResolvedSearchParams>
): Promise<string> {
  // 🛡️ Ecosystem Identity Guard
  const user = await ensureIndustrialAccess('ADMIN');
  
  // Resolve searchParams if it is passed as a Promise (Next.js 15+ async params)
  const resolvedParams: ResolvedSearchParams = searchParams instanceof Promise
    ? await searchParams
    : searchParams;
  
  let queryTenantId: string | null = null;
  
  if (resolvedParams) {
    if (resolvedParams instanceof URLSearchParams) {
      queryTenantId = resolvedParams.get('tenantId');
    } else {
      const val = (resolvedParams as Record<string, string | string[] | undefined>)['tenantId'];
      if (typeof val === 'string') {
        queryTenantId = val;
      } else if (Array.isArray(val)) {
        queryTenantId = val[0] ?? null;
      }
    }
  }

  // 🛡️ Anti-IDOR: Only allow context shifting if user is a SUPER_ADMIN
  if (user.role === 'SUPER_ADMIN' && queryTenantId) {
    return queryTenantId;
  }
  
  return user.tenantId;
}
