import { auditService } from './AuditService';
import { coreDb } from '../db/SystemDB';
import { AppError } from '../utils/AppError';

/**
 * Supervisor Service (Era 6.1)
 * Centralizes dashboard governance and forensic observability.
 */
class SupervisorService {
  /**
   * Logs access to the supervisor dashboard.
   */
  async logDashboardAccess(operatorId: string, username: string) {
    await auditService.log({
      module: 'SUPERVISOR',
      messageKey: 'supervisor.dashboard.access',
      status: 'SUCCESS',
      operatorId,
      details: {
        eventType: 'DASHBOARD_ACCESS',
        entityType: 'DASHBOARD',
        entityId: 'SUPERVISOR',
        actorId: operatorId,
        actorUser: username,
        severity: 'INFO'
      }
    });
  }

  /**
   * Fetches the recent security activity feed using industrial standards.
   */
  async getSecurityActivityFeed(limit: number = 10) {
    try {
      const logs = await coreDb.table('system_log')
        .filter((l: any) => l.category === 'AUTH' || l.category === 'RBAC' || l.category === 'SECURITY')
        .reverse()
        .limit(limit)
        .toArray();
      
      return logs.map(l => ({
        ...l,
        details: JSON.parse(l.details || '{}')
      }));
    } catch (err) {
      throw new AppError('Failed to fetch security activity feed', 'DATABASE_ERROR');
    }
  }
}

export const supervisorService = new SupervisorService();
