import { coreDb } from '../db/SystemDB';
import { auditService } from './AuditService';
import { Operator } from '../types/auth.types';

/**
 * Industrial Operator Service (Phase 11.2)
 * Handles advanced identity governance and lifecycle management.
 */
class OperatorService {
  /**
   * Transfers the master (root) capability from one administrator to another.
   * This is a critical security event that requires full auditing.
   */
  async transferMasterRole(fromId: string, toId: string, performedById: string): Promise<void> {
    if (fromId === toId) return;

    try {
      const [from, to, actor] = await Promise.all([
        coreDb.operators.get(fromId),
        coreDb.operators.get(toId),
        coreDb.operators.get(performedById),
      ]);

      if (!from || !to || !actor) throw new Error('OPERATOR_NOT_FOUND');
      if (!from.isMaster) throw new Error('SOURCE_NOT_MASTER');
      if (from.isActive === 0 || to.isActive === 0) throw new Error('INACTIVE_OPERATOR');

      if (to.role !== 'ADMIN') {
        throw new Error('TARGET_NOT_ADMIN');
      }

      // Execute transaction for atomicity
      await coreDb.transaction('rw', [coreDb.operators, coreDb.system_log], async () => {
        await coreDb.operators.update(from.id, {
          isMaster: false,
          updatedAt: Date.now(),
        });
        await coreDb.operators.update(to.id, {
          isMaster: true,
          updatedAt: Date.now(),
        });

        // Register in security audit
        await auditService.log({
          module: 'SECURITY',
          messageKey: 'operator.master.transfer',
          status: 'WARNING', // High-level security change
          details: {
            fromId: from.id,
            fromUser: from.username,
            toId: to.id,
            toUser: to.username,
            performedById: actor.id,
            performedByUser: actor.username,
          },
          operatorId: actor.id
        });
      });

      console.log(`[OPERATOR-SERVICE] Master role successfully transferred from ${from.username} to ${to.username}`);
    } catch (err) {
      console.error('[OPERATOR-SERVICE] Master transfer failed', err);
      throw err;
    }
  }

  /**
   * Lists all operators with optional filtering
   */
  async list(): Promise<Operator[]> {
    return await coreDb.operators.toArray();
  }
}

export const operatorService = new OperatorService();
