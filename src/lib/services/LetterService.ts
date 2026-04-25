import { db } from '../db/db';
import { auditService } from './AuditService';
import { LetterTemplate, LetterMapping, LetterGenerationOptions } from '../types/letter.types';
import { LetterGenerationOptionsSchema } from '../schemas/industrial.schema';
import { ValidationError, NotFoundError } from '../utils/AppError';

/**
 * Letter Station Service (Era 6.1)
 * Centralizes document generation lifecycle and resource management.
 */
class LetterService {
  /**
   * Validates generation options before starting the motor.
   */
  validateOptions(options: LetterGenerationOptions) {
    const result = LetterGenerationOptionsSchema.safeParse(options);
    if (!result.success) {
      throw new ValidationError('Invalid generation options', result.error.format());
    }
    return result.data;
  }

  /**
   * Records a batch generation event in the forensic audit.
   */
  async logBatchExecution(operatorId: string, options: LetterGenerationOptions, stats: { totalDocs: number; presetName: string; templateName: string }) {
    await auditService.log({
      module: 'LETTER',
      messageKey: 'letter.batch.run',
      status: 'SUCCESS',
      operatorId,
      details: {
        eventType: 'LETTER_BATCH_RUN',
        entityType: 'LETTER_BATCH',
        entityId: `batch_${options.lote}_${Date.now()}`,
        actorId: operatorId,
        severity: 'INFO',
        context: {
          ...options,
          ...stats
        }
      }
    });
  }

  /**
   * Records a QA failure (layout regression).
   */
  async logQAFailure(operatorId: string, lote: string, codDocumento: string) {
    await auditService.log({
      module: 'LETTER',
      messageKey: 'letter.qa.break',
      status: 'ERROR',
      operatorId,
      details: {
        eventType: 'LETTER_QA_BREAK',
        entityType: 'LETTER_QA',
        entityId: lote,
        actorId: operatorId,
        severity: 'CRITICAL',
        context: { lote, codDocumento }
      }
    });
  }

  /**
   * Template Management
   */
  async getTemplate(id: string) {
    const template = await db.lettertemplates_v6.get(id);
    if (!template) throw new NotFoundError('LETTER_TEMPLATE', id);
    return template;
  }

  async listTemplates() {
    return await db.lettertemplates_v6.toArray();
  }

  async listPresets() {
    return await db.presets_v6.toArray();
  }

  async listMappings() {
    return await db.lettermappings_v6.toArray();
  }
}

export const letterService = new LetterService();
