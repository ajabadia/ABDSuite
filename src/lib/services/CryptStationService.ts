import { auditService } from './AuditService';
import { CryptOptionsSchema } from '../schemas/industrial.schema';
import { ValidationError } from '../utils/AppError';

/**
 * Crypt Station Service (Era 6.1)
 * Centralizes vault operations and forensic reporting.
 */
class CryptStationService {
  /**
   * Validates crypt options.
   */
  validateOptions(options: any) {
    const result = CryptOptionsSchema.safeParse(options);
    if (!result.success) {
      throw new ValidationError('Invalid crypt parameters', result.error.format());
    }
    return result.data;
  }

  /**
   * Logs a batch cryptographic operation.
   */
  async logBatchResult(operatorId: string, username: string, mode: string, stats: { total: number, success: number, error: number, skip: number }) {
    await auditService.log({
      module: 'CRYPT',
      messageKey: 'crypt.batch.run',
      status: stats.error > 0 ? 'WARNING' : 'SUCCESS',
      operatorId,
      details: {
        eventType: 'CRYPTBATCHRUN',
        entityType: 'CRYPT_BATCH',
        entityId: `BATCH_${Date.now()}`,
        actorId: operatorId,
        actorUser: username,
        severity: stats.error > 0 ? 'WARN' : 'INFO',
        context: {
          mode: mode.toUpperCase(),
          ...stats
        }
      }
    });
  }
}

export const cryptStationService = new CryptStationService();
