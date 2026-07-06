/**
 * @purpose Wraps Server Actions with tenant context resolution, DB connection, session auth,
 * try/catch error handling with audit logging, and optional revalidation.
 * Eliminates ~15 lines of boilerplate per action.
 */

import { getIndustrialSession } from '@ajabadia/satellite-sdk/auth-middleware';
import { connectDB, withTenantContext } from '@ajabadia/satellite-sdk/db';
import type { TenantContext } from '@ajabadia/satellite-sdk/db';
import { logger } from '@ajabadia/satellite-sdk/logger';
import { resolveTargetTenantContext } from '@ajabadia/satellite-sdk/utils';
import { revalidatePath } from 'next/cache';

export interface ActionContext {
  session: { id: string; tenantId: string; email?: string; role?: string };
  activeTenantId: string;
  explicitCtx: TenantContext | null | undefined;
}

export type ActionResult =
  | ({ success: true } & Record<string, unknown>)
  | { success: false; error: string };

interface ReadActionOptions {
  tenantIdParam?: string;
}

interface WriteActionOptions {
  tenantIdParam?: string;
  revalidatePaths?: string | string[];
  errorAction: string;
  errorEntityType: string;
  errorEntityId?: string;
  errorLogLabel?: string;
}

function buildContext(explicitCtx: TenantContext | null | undefined, session: { user?: { id?: string; tenantId?: string; email?: string; role?: string } }): ActionContext {
  const activeTenantId = explicitCtx?.tenantId || session?.user?.tenantId || '';
  return {
    session: {
      id: session?.user?.id || '',
      tenantId: session?.user?.tenantId || '',
      email: session?.user?.email,
      role: session?.user?.role,
    },
    activeTenantId,
    explicitCtx,
  };
}

export async function withReadAction<T>(
  fn: (ctx: ActionContext) => Promise<T>,
  options?: ReadActionOptions
): Promise<T> {
  const explicitCtx = await resolveTargetTenantContext(options?.tenantIdParam);
  return withTenantContext(async () => {
    try {
      await connectDB();
      const session = await getIndustrialSession();
      if (!session?.user?.id || !session?.user?.tenantId) {
        throw new Error('Unauthorized');
      }
      return await fn(buildContext(explicitCtx, session));
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      await logger.audit({
        tenantId: explicitCtx?.tenantId || 'unknown',
        action: 'READ_ERROR',
        entityType: 'UNKNOWN',
        entityId: 'unknown',
        userId: 'system',
        userEmail: 'system@abd.com',
        changedFields: { error: msg },
      });
      console.error('❌ Read action error:', msg);
      throw new Error(msg);
    }
  }, explicitCtx);
}

export async function withWriteAction(
  fn: (ctx: ActionContext) => Promise<ActionResult>,
  options: WriteActionOptions
): Promise<ActionResult> {
  const explicitCtx = await resolveTargetTenantContext(options.tenantIdParam);
  return withTenantContext(async () => {
    try {
      await connectDB();
      const session = await getIndustrialSession();
      if (!session?.user?.id || !session?.user?.tenantId) {
        return { success: false, error: 'Unauthorized' };
      }
      const ctx = buildContext(explicitCtx, session);
      const result = await fn(ctx);
      if (result.success && options.revalidatePaths) {
        const paths = Array.isArray(options.revalidatePaths)
          ? options.revalidatePaths
          : [options.revalidatePaths];
        paths.forEach((p) => revalidatePath(p));
      }
      return result;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      await logger.audit({
        tenantId: explicitCtx?.tenantId || 'unknown',
        action: options.errorAction,
        entityType: options.errorEntityType,
        entityId: options.errorEntityId || 'unknown',
        userId: 'system',
        userEmail: 'system@abd.com',
        changedFields: { error: msg },
      });
      console.error(`❌ ${options.errorLogLabel || options.errorAction}:`, msg);
      return { success: false, error: msg };
    }
  }, explicitCtx);
}
