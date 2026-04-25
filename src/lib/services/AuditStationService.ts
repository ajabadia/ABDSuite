import { auditService } from './AuditService';
import { AuditOptionsSchema } from '../schemas/industrial.schema';
import { ValidationError } from '../utils/AppError';

/**
 * Audit Station Service (Era 6.1)
 * Centralizes GAWEB validation governance and industrial reporting.
 */
class AuditStationService {
  /**
   * Validates audit parameters.
   */
  validateOptions(options: any) {
    const result = AuditOptionsSchema.safeParse(options);
    if (!result.success) {
      throw new ValidationError('Invalid audit parameters', result.error.format());
    }
    return result.data;
  }

  /**
   * Logs a completed GAWEB audit session.
   */
  async logAuditResult(operatorId: string, fileName: string, summary: any, profile: any) {
    await auditService.log({
      module: 'AUDIT',
      messageKey: 'gaweb.audit.run',
      status: summary.totalErrors > 0 ? 'WARNING' : 'SUCCESS',
      operatorId,
      details: {
        eventType: 'GAWEBAUDITRUN',
        entityType: 'GAWEB_FILE',
        entityId: fileName,
        severity: summary.totalErrors > 0 ? 'WARN' : 'INFO',
        context: {
          fileName,
          totalLines: summary.totalLines,
          totalErrors: summary.totalErrors,
          totalWarnings: summary.totalWarnings,
          md5Witness: summary.md5Matches ? 'MATCH' : 'MISMATCH',
          goldenProfile: profile?.name || 'NONE',
          goldenVersion: profile?.version || 'N/A'
        }
      }
    });
  }
}

export const auditStationService = new AuditStationService();
