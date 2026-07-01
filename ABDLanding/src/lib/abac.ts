/**
 * @purpose Valida que el usuario tenga las permisiones necesarias para realizar una acción sobre un recurso utilizando ABAC.
 * @purpose_en Validates that a user has the necessary permissions to perform an action on a resource using ABAC.
 * @refactorable false
 * @classification Helper Utility
 * @complexity Low
 * @fingerprint exports:2,imports:1,sig:xe7cw6
 * @lastUpdated 2026-06-25T10:23:45.078Z
 */

import { evaluateAccess, InsufficientPrivilegesError } from '@ajabadia/satellite-sdk/auth-middleware';

export interface AssertAccessParams {
  userId: string;
  tenantId: string;
  resource: string;
  action: string;
  context?: Record<string, unknown>;
}

/**
 * Asserts that the actor has permission to perform the action on the resource.
 * Throws InsufficientPrivilegesError if the Guardian Engine denies access.
 */
export async function assertAccess(params: AssertAccessParams): Promise<void> {
  const result = await evaluateAccess({
    tenantId: params.tenantId,
    userId: params.userId,
    resource: params.resource,
    action: params.action,
    context: params.context
  });

  if (!result.allowed) {
    throw new InsufficientPrivilegesError(`ABAC Denied: ${result.reason}`);
  }
}
