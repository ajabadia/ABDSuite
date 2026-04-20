import { coreDb } from '../db/SystemDB';
import { auditService } from './AuditService';
import { Operator, UserRole } from '../types/auth.types';
import { hashPin } from '../utils/crypto.utils';

/**
 * Industrial Operator Service (Phase 11.2)
 * Handles advanced identity governance and lifecycle management.
 */
class OperatorService {
  /**
   * Helper to ensure we don't deactivate or change role of the last active ADMIN.
   */
  private async validateLastAdmin(opId: string, nextActive: number, nextRole: UserRole): Promise<boolean> {
    if (!opId) return true; // New user is safe
    
    const activeAdmins = await coreDb.operators
      .where('role').equals('ADMIN')
      .filter(op => op.isActive === 1)
      .toArray();

    if (activeAdmins.length === 1 && activeAdmins[0].id === opId) {
      if (nextActive === 0 || nextRole !== 'ADMIN') {
        return false;
      }
    }
    return true;
  }

  /**
   * Creates a new operator with initial PIN and audit log.
   */
  async create(data: Partial<Operator>, rawPin: string, actorId: string): Promise<string> {
    const id = crypto.randomUUID();
    const pinHash = await hashPin(rawPin);
    
    const newOp: Operator = {
      ...data,
      id,
      pinHash,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isActive: 1,
      isMaster: false,
      mfaEnabled: false,
    } as Operator;

    await coreDb.operators.add(newOp);
    
    await auditService.log({
      module: 'SECURITY',
      messageKey: 'operator.create',
      status: 'INFO',
      operatorId: actorId,
      details: {
        eventType: 'OPERATOR_CREATE',
        entityType: 'OPERATOR',
        entityId: id,
        actorId: actorId,
        severity: 'INFO',
        context: { username: newOp.username, role: newOp.role }
      }
    });

    return id;
  }

  /**
   * Updates an existing operator's profile.
   */
  async update(id: string, data: Partial<Operator>, actorId: string, newPin?: string): Promise<void> {
    const existing = await coreDb.operators.get(id);
    if (!existing) throw new Error('OPERATOR_NOT_FOUND');

    // Safety check: Last Admin
    if (data.isActive !== undefined || data.role !== undefined) {
      const isSafe = await this.validateLastAdmin(id, data.isActive ?? existing.isActive, data.role ?? existing.role);
      if (!isSafe) throw new Error('LAST_ADMIN_PROTECTION');
    }

    const updates: Partial<Operator> = {
      ...data,
      updatedAt: Date.now(),
    };

    if (newPin) {
      updates.pinHash = await hashPin(newPin);
    }

    // Advanced Audit Logic (Branch 12.1)
    const roleBefore = existing.role;
    const roleAfter = updates.role ?? existing.role;
    const roleChanged = roleBefore !== roleAfter;

    const beforeExtra = existing.extraCapabilities || [];
    const beforeDenied = existing.deniedCapabilities || [];
    const afterExtra = updates.extraCapabilities ?? beforeExtra;
    const afterDenied = updates.deniedCapabilities ?? beforeDenied;

    const overridesChanged = 
      JSON.stringify(beforeExtra) !== JSON.stringify(afterExtra) ||
      JSON.stringify(beforeDenied) !== JSON.stringify(afterDenied);

    let messageKey = 'operator.update';
    let eventType = 'OPERATOR_UPDATE';
    let severity: 'INFO' | 'WARN' | 'CRITICAL' = 'INFO';

    // Sensitivity check for critical capabilities
    const SENSITIVE_CAPS: string[] = ['SETTINGS_GLOBAL', 'OPERATORS_MANAGE', 'CRYPT_CONFIG_GLOBAL', 'AUDIT_CONFIG', 'LETTER_CONFIG_GLOBAL', 'ETL_CONFIG_GLOBAL'];
    const touchesSensitive = [...afterExtra, ...afterDenied, ...beforeExtra, ...beforeDenied].some(c => SENSITIVE_CAPS.includes(c));

    if (roleChanged) {
      messageKey = 'operator.role.change';
      eventType = 'OPERATOR_ROLE_CHANGE';
      severity = 'CRITICAL';
    } else if (overridesChanged) {
      messageKey = 'operator.capabilities.override';
      eventType = 'OPERATOR_CAPABILITY_OVERRIDE';
      severity = touchesSensitive ? 'CRITICAL' : 'WARN';
    }

    await coreDb.operators.update(id, updates);

    await auditService.log({
      module: 'SECURITY',
      messageKey,
      status: severity === 'CRITICAL' ? 'WARNING' : severity === 'WARN' ? 'WARNING' : 'INFO',
      operatorId: actorId,
      details: {
        eventType,
        entityType: 'OPERATOR',
        entityId: id,
        actorId: actorId,
        severity,
        context: {
          username: existing.username,
          updates: Object.keys(data).join(', '),
          ...(roleChanged && { fromRole: roleBefore, toRole: roleAfter }),
          ...(overridesChanged && { 
            beforeExtra: beforeExtra.join(','), 
            afterExtra: afterExtra.join(','),
            beforeDenied: beforeDenied.join(','),
            afterDenied: afterDenied.join(',')
          })
        }
      }
    });
  }

  /**
   * Transfers the master (root) capability from one administrator to another.
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
          status: 'WARNING',
          operatorId: actor.id,
          details: {
            eventType: 'OPERATOR_MASTER_TRANSFER',
            entityType: 'OPERATOR',
            entityId: to.id,
            actorId: actor.id,
            actorUser: actor.username,
            severity: 'CRITICAL',
            context: {
              fromId: from.id,
              fromUser: from.username,
              toId: to.id,
              toUser: to.username,
            },
          },
        });
      });

      console.log(`[OPERATOR-SERVICE] Master role successfully transferred from ${from.username} to ${to.username}`);
    } catch (err) {
      console.error('[OPERATOR-SERVICE] Master transfer failed', err);
      throw err;
    }
  }

  /**
   * Lists all operators
   */
  async list(): Promise<Operator[]> {
    return await coreDb.operators.toArray();
  }
}

export const operatorService = new OperatorService();
