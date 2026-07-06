import { getIndustrialSession } from '@ajabadia/satellite-sdk/auth-middleware';
import { connectDB, withTenantContext } from '@ajabadia/satellite-sdk/db';
import { logger } from '@ajabadia/satellite-sdk/logger';
import { assertAccess } from '@/lib/abac';

export interface ReadActionCtx {
  userId: string;
  tenantId: string;
}

interface ReadActionOptions {
  resource?: string;
  action?: string;
}

export async function withReadAction<T>(
  fn: (ctx: ReadActionCtx) => Promise<T>,
  options?: ReadActionOptions
): Promise<T> {
  return await withTenantContext(async () => {
    try {
      await connectDB();
      const session = await getIndustrialSession();
      if (!session?.user?.id || !session?.user?.tenantId) {
        throw new Error('Unauthorized');
      }
      const ctx: ReadActionCtx = {
        userId: session.user.id,
        tenantId: session.user.tenantId,
      };
      if (options?.resource && options?.action) {
        await assertAccess({
          userId: ctx.userId,
          tenantId: ctx.tenantId,
          resource: options.resource,
          action: options.action,
        });
      }
      return await fn(ctx);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      await logger.audit({
        tenantId: 'unknown',
        action: 'READ_ERROR',
        entityType: 'DASHBOARD',
        entityId: 'unknown',
        userId: 'system',
        userEmail: 'system@abd.com',
        changedFields: { error: msg },
      });
      console.error('❌ Read action error:', msg);
      throw error;
    }
  });
}
