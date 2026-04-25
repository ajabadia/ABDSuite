import { db } from '../db/db';
import { auditService } from './AuditService';
import { EtlProcessorOptions, EtlProcessorOptionsSchema } from '../types/etl-processor.types';
import { ValidationError, NotFoundError } from '../utils/AppError';

/**
 * ETL Studio Service (Era 6.1)
 * Governs data transformation and extraction workflows.
 */
class EtlService {
  /**
   * Validates processor options.
   */
  validateOptions(options: EtlProcessorOptions) {
    const result = EtlProcessorOptionsSchema.safeParse(options);
    if (!result.success) {
      throw new ValidationError('Invalid ETL options', result.error.format());
    }
    return result.data;
  }

  /**
   * Logs start of ETL process.
   */
  async logEtlStart(operatorId: string, presetName: string, fileName: string) {
    await auditService.log({
      module: 'ETL',
      messageKey: 'etl.process.start',
      status: 'INFO',
      operatorId,
      details: {
        eventType: 'ETL_START',
        entityType: 'ETL_PRESET',
        actorId: operatorId,
        severity: 'INFO',
        context: { presetName, fileName }
      }
    });
  }

  /**
   * Logs completion of ETL process.
   */
  async logEtlComplete(operatorId: string, presetName: string, stats: any) {
    await auditService.log({
      module: 'ETL',
      messageKey: 'etl.process.complete',
      status: 'SUCCESS',
      operatorId,
      details: {
        eventType: 'ETL_COMPLETE',
        entityType: 'ETL_PRESET',
        actorId: operatorId,
        severity: 'INFO',
        context: { presetName, ...stats }
      }
    });
  }

  async getPreset(id: string) {
    const preset = await db.presets_v6.get(id);
    if (!preset) throw new NotFoundError('ETL_PRESET', id);
    return preset;
  }

  async listPresets() {
    return await db.presets_v6.toArray();
  }
}

export const etlService = new EtlService();
