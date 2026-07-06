/**
 * @purpose Gestiona configuraciones de exámenes para los inquilinos, incluyendo la recuperación, creación y clonación de configuraciones.
 * @purpose_en Manages exam configurations for tenants, including fetching, creating, and cloning configurations.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:5,imports:9,sig:1atgmji
 * @lastUpdated 2026-06-26T10:01:20.386Z
 */

'use server';

import { logger } from '@ajabadia/satellite-sdk/logger';
import ExamConfig from '@/models/ExamConfig';
import { type IExamConfig } from '@/models/ExamConfig';
import { withReadAction, withWriteAction } from '@/lib/actions-wrapper';
import { type SerializedExamConfig } from '@/types/quiz';
import { seedDefaultConfigs, serializeExamConfig } from './examConfigHelpers';

/**
 * Recupera todas las configuraciones de examen activas para el tenant
 */
export async function getExamConfigsAction(tenantIdParam?: string) {
  return withReadAction(async (ctx) => {
    let configs = await ExamConfig.find({
      tenantId: ctx.activeTenantId,
      active: true,
    }).sort({ createdAt: -1 }).lean();

    if (configs.length === 0) {
      await seedDefaultConfigs(ctx.activeTenantId, ctx.session.id);
      configs = await ExamConfig.find({
        tenantId: ctx.activeTenantId,
        active: true,
      }).sort({ createdAt: -1 }).lean();
    }

    return configs.map((c) => serializeExamConfig(c as unknown as Record<string, unknown>));
  }, { tenantIdParam });
}

/**
 * Crea una nueva configuración de examen
 */
export async function createExamConfigAction(data: Partial<IExamConfig>, tenantIdParam?: string) {
  return withWriteAction(async (ctx) => {
    const newConfig = await ExamConfig.create({
      ...data,
      tenantId: ctx.activeTenantId,
      createdBy: ctx.session.id,
    });

    await logger.audit({
      tenantId: ctx.activeTenantId,
      action: 'EXAM_CONFIG_CREATED',
      entityType: 'CONFIG',
      entityId: newConfig._id.toString(),
      userId: ctx.session.id,
      userEmail: ctx.session.email || 'system@abd.com',
      changedFields: { ...data, tenantId: ctx.activeTenantId },
    });

    return { success: true, id: newConfig._id.toString() } as const;
  }, {
    tenantIdParam,
    revalidatePaths: ['/admin/exams', '/'],
    errorAction: 'CREATE_EXAM_CONFIG_ERROR',
    errorEntityType: 'CONFIG',
    errorLogLabel: 'Error creating exam config',
  });
}

/**
 * Actualiza una configuración existente
 */
export async function updateExamConfigAction(id: string, data: Partial<IExamConfig>, tenantIdParam?: string) {
  return withWriteAction(async (ctx) => {
    const config = await ExamConfig.findById(id);
    if (!config) {
      return { success: false, error: 'Acceso no autorizado' };
    }

    if (config.tenantId !== ctx.activeTenantId && ctx.session.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Acceso no autorizado' };
    }

    const targetTenantId = config.tenantId;
    const previousState = config.toObject() as unknown as Record<string, unknown>;
    await ExamConfig.findByIdAndUpdate(id, data);

    await logger.audit({
      tenantId: targetTenantId,
      action: 'EXAM_CONFIG_UPDATED',
      entityType: 'CONFIG',
      entityId: id,
      userId: ctx.session.id,
      userEmail: ctx.session.email || 'system@abd.com',
      changedFields: data as Record<string, unknown>,
      previousState,
    });

    return { success: true };
  }, {
    tenantIdParam,
    revalidatePaths: ['/admin/exams', '/'],
    errorAction: 'UPDATE_EXAM_CONFIG_ERROR',
    errorEntityType: 'CONFIG',
    errorEntityId: id,
    errorLogLabel: 'Error updating exam config',
  });
}

/**
 * Borrado lógico de una configuración
 */
export async function deleteExamConfigAction(id: string, tenantIdParam?: string) {
  return withWriteAction(async (ctx) => {
    const config = await ExamConfig.findById(id);
    if (!config) {
      return { success: false, error: 'Acceso no autorizado' };
    }

    if (config.tenantId !== ctx.activeTenantId && ctx.session.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Acceso no autorizado' };
    }

    const targetTenantId = config.tenantId;
    const previousState = config.toObject() as unknown as Record<string, unknown>;
    await ExamConfig.findByIdAndUpdate(id, { active: false });

    await logger.audit({
      tenantId: targetTenantId,
      action: 'EXAM_CONFIG_DELETED',
      entityType: 'CONFIG',
      entityId: id,
      userId: ctx.session.id,
      userEmail: ctx.session.email || 'system@abd.com',
      changedFields: { active: false },
      previousState,
    });

    return { success: true };
  }, {
    tenantIdParam,
    revalidatePaths: ['/admin/exams', '/'],
    errorAction: 'DELETE_EXAM_CONFIG_ERROR',
    errorEntityType: 'CONFIG',
    errorEntityId: id,
    errorLogLabel: 'Error deleting exam config',
  });
}

/**
 * Clona una configuración de examen existente
 */
export async function cloneExamConfigAction(id: string, tenantIdParam?: string) {
  return withWriteAction(async (ctx) => {
    const source = await ExamConfig.findById(id).lean();
    if (!source) {
      return { success: false, error: 'Configuración origen no encontrada o acceso no autorizado' };
    }

    if (source.tenantId !== ctx.activeTenantId && ctx.session.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Configuración origen no encontrada o acceso no autorizado' };
    }

    const { _id, createdAt, updatedAt, ...rest } = source as unknown as Record<string, unknown>;

    const cloned = await ExamConfig.create({
      ...rest,
      tenantId: source.tenantId,
      name: `${source.name} (Copia)`,
      isDefault: false,
    });

    await logger.audit({
      tenantId: source.tenantId,
      action: 'EXAM_CONFIG_CLONED',
      entityType: 'CONFIG',
      entityId: cloned._id.toString(),
      userId: ctx.session.id,
      userEmail: ctx.session.email || 'system@abd.com',
      changedFields: {
        sourceId: id,
        name: cloned.name,
      },
    });

    return { success: true, id: cloned._id.toString() } as const;
  }, {
    tenantIdParam,
    revalidatePaths: ['/admin/exams', '/'],
    errorAction: 'CLONE_EXAM_CONFIG_ERROR',
    errorEntityType: 'CONFIG',
    errorEntityId: id,
    errorLogLabel: 'Error cloning exam config',
  });
}
