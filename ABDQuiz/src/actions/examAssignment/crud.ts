/**
 * @purpose Gestiona la creación, actualización y eliminación de asignaciones de exámenes dentro del contexto de un inquilino.
 * @purpose_en Manages the creation, updating, and deletion of exam assignments within a tenant context.
 * @refactorable true
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:6,imports:8,sig:ci3gq2
 * @lastUpdated 2026-07-06
 */

'use server';

import { logger } from '@ajabadia/satellite-sdk/logger';
import ExamConfig from '@/models/ExamConfig';
import ExamAssignment from '@/models/ExamAssignment';
import { withWriteAction } from '@/lib/actions-wrapper';
import { auditEntry } from './utils';
import { validateTenantAccess, fromActionContext } from './shared';
import type { CreateAssignmentData, UpdateAssignmentData } from './types';

// --- Create ---

export async function createAssignmentAction(data: CreateAssignmentData, tenantIdParam?: string) {
  return withWriteAction(async (ctx) => {
    const configExists = await ExamConfig.findOne({
      _id: data.examConfigId,
      tenantId: ctx.activeTenantId,
      active: true,
    });
    if (!configExists) {
      return { success: false, error: 'La configuración de examen no existe o no está activa' };
    }

    if (new Date(data.endDate) <= new Date(data.startDate)) {
      return { success: false, error: 'La fecha de fin debe ser posterior a la fecha de inicio' };
    }

    const newAssignment = await ExamAssignment.create({
      tenantId: ctx.activeTenantId,
      examConfigId: data.examConfigId,
      assignedToType: data.assignedToType,
      assignedToId: data.assignedToId,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      status: 'draft',
      maxAttempts: data.maxAttempts || 0,
      active: true,
      createdBy: ctx.session.id,
      auditTrail: [auditEntry('QUIZ_ASSIGNMENT_CREATE', ctx.session.id, ctx.session.email || 'system@abd.com', 'Asignación creada')],
    });

    await logger.audit({
      tenantId: ctx.activeTenantId,
      action: 'QUIZ_ASSIGNMENT_CREATE',
      entityType: 'ASSIGNMENT',
      entityId: newAssignment._id.toString(),
      userId: ctx.session.id,
      userEmail: ctx.session.email || 'system@abd.com',
      changedFields: data as unknown as Record<string, unknown>,
    });

    return { success: true, id: newAssignment._id.toString() } as const;
  }, {
    tenantIdParam,
    revalidatePaths: '/admin/assignments',
    errorAction: 'CREATE_ASSIGNMENT_ERROR',
    errorEntityType: 'ASSIGNMENT',
    errorLogLabel: 'Error creating assignment',
  });
}

// --- Update ---

export async function updateAssignmentAction(id: string, data: UpdateAssignmentData, tenantIdParam?: string) {
  return withWriteAction(async (ctx) => {
    const aCtx = fromActionContext(ctx);

    const assignment = await ExamAssignment.findById(id);
    if (!assignment) {
      return { success: false, error: 'Asignación no encontrada' };
    }

    if (!validateTenantAccess(assignment.tenantId, aCtx)) {
      return { success: false, error: 'Acceso no autorizado' };
    }

    if (assignment.status === 'published') {
      const lockedFields: string[] = [];
      if (data.examConfigId && data.examConfigId !== assignment.examConfigId.toString()) {
        lockedFields.push('examen');
      }
      if (data.assignedToType && data.assignedToType !== assignment.assignedToType) {
        lockedFields.push('tipo de destinatario');
      }
      if (data.assignedToId && data.assignedToId !== assignment.assignedToId) {
        lockedFields.push('destinatario');
      }
      if (lockedFields.length > 0) {
        return { success: false, error: `No se puede modificar ${lockedFields.join(', ')} porque la asignación ya está publicada` };
      }
    }

    const updateData: Record<string, unknown> = {};
    if (data.examConfigId) updateData.examConfigId = data.examConfigId;
    if (data.assignedToType) updateData.assignedToType = data.assignedToType;
    if (data.assignedToId) updateData.assignedToId = data.assignedToId;
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);
    if (data.maxAttempts !== undefined) updateData.maxAttempts = data.maxAttempts;

    if (data.startDate || data.endDate) {
      const newStart = data.startDate ? new Date(data.startDate) : assignment.startDate;
      const newEnd = data.endDate ? new Date(data.endDate) : assignment.endDate;
      if (newEnd <= newStart) {
        return { success: false, error: 'La fecha de fin debe ser posterior a la fecha de inicio' };
      }
    }

    const previousState = assignment.toObject() as unknown as Record<string, unknown>;
    const updatedFields = Object.keys(updateData).join(', ');
    await ExamAssignment.findByIdAndUpdate(id, {
      $set: updateData,
      $push: { auditTrail: auditEntry('QUIZ_ASSIGNMENT_UPDATE', ctx.session.id, ctx.session.email || 'system@abd.com', `Campos modificados: ${updatedFields}`) },
    });

    await logger.audit({
      tenantId: assignment.tenantId,
      action: 'QUIZ_ASSIGNMENT_UPDATE',
      entityType: 'ASSIGNMENT',
      entityId: id,
      userId: ctx.session.id,
      userEmail: ctx.session.email || 'system@abd.com',
      changedFields: updateData,
      previousState,
    });

    return { success: true };
  }, {
    tenantIdParam,
    revalidatePaths: '/admin/assignments',
    errorAction: 'UPDATE_ASSIGNMENT_ERROR',
    errorEntityType: 'ASSIGNMENT',
    errorEntityId: id,
    errorLogLabel: 'Error updating assignment',
  });
}

// --- Publish ---

export async function publishAssignmentAction(id: string, tenantIdParam?: string) {
  return withWriteAction(async (ctx) => {
    const aCtx = fromActionContext(ctx);

    const assignment = await ExamAssignment.findById(id);
    if (!assignment) {
      return { success: false, error: 'Asignación no encontrada' };
    }

    if (!validateTenantAccess(assignment.tenantId, aCtx)) {
      return { success: false, error: 'Acceso no autorizado' };
    }

    if (assignment.status === 'archived') {
      return { success: false, error: 'No se puede publicar una asignación archivada' };
    }

    if (assignment.endDate <= assignment.startDate) {
      return { success: false, error: 'La fecha de fin debe ser posterior a la fecha de inicio' };
    }

    const previousState = assignment.toObject() as unknown as Record<string, unknown>;
    await ExamAssignment.findByIdAndUpdate(id, {
      $set: { status: 'published' },
      $push: { auditTrail: auditEntry('QUIZ_ASSIGNMENT_PUBLISHED', ctx.session.id, ctx.session.email || 'system@abd.com', 'Asignación publicada') },
    });

    await logger.audit({
      tenantId: assignment.tenantId,
      action: 'QUIZ_ASSIGNMENT_PUBLISHED',
      entityType: 'ASSIGNMENT',
      entityId: id,
      userId: ctx.session.id,
      userEmail: ctx.session.email || 'system@abd.com',
      changedFields: { status: 'published' },
      previousState,
    });

    return { success: true };
  }, {
    tenantIdParam,
    revalidatePaths: ['/admin/assignments', '/'],
    errorAction: 'PUBLISH_ASSIGNMENT_ERROR',
    errorEntityType: 'ASSIGNMENT',
    errorEntityId: id,
    errorLogLabel: 'Error publishing assignment',
  });
}

// --- Status update (archive / delete / restore) ---

type AssignmentStatusAction = 'archive' | 'delete' | 'restore';

const statusActionMap: Record<AssignmentStatusAction, {
  auditAction: string;
  auditMsg: string;
  update: Record<string, unknown>;
  errorAction: string;
  errorLogLabel: string;
}> = {
  archive: {
    auditAction: 'QUIZ_ASSIGNMENT_ARCHIVED',
    auditMsg: 'Asignación archivada',
    update: { status: 'archived' },
    errorAction: 'ARCHIVE_ASSIGNMENT_ERROR',
    errorLogLabel: 'Error archiving assignment',
  },
  delete: {
    auditAction: 'QUIZ_ASSIGNMENT_DELETED',
    auditMsg: 'Asignación eliminada (soft)',
    update: { active: false },
    errorAction: 'DELETE_ASSIGNMENT_ERROR',
    errorLogLabel: 'Error deleting assignment',
  },
  restore: {
    auditAction: 'QUIZ_ASSIGNMENT_RESTORED',
    auditMsg: 'Asignación restaurada',
    update: { active: true, status: 'draft' },
    errorAction: 'RESTORE_ASSIGNMENT_ERROR',
    errorLogLabel: 'Error restoring assignment',
  },
};

export async function updateAssignmentStatusAction(
  id: string,
  action: AssignmentStatusAction,
  tenantIdParam?: string
) {
  const actionConfig = statusActionMap[action];
  if (!actionConfig) {
    return { success: false, error: 'Acción no válida' };
  }

  return withWriteAction(async (ctx) => {
    const aCtx = fromActionContext(ctx);

    const assignment = await ExamAssignment.findById(id);
    if (!assignment) {
      return { success: false, error: 'Asignación no encontrada' };
    }

    if (!validateTenantAccess(assignment.tenantId, aCtx)) {
      return { success: false, error: 'Acceso no autorizado' };
    }

    const previousState = assignment.toObject() as unknown as Record<string, unknown>;
    await ExamAssignment.findByIdAndUpdate(id, {
      $set: actionConfig.update,
      $push: { auditTrail: auditEntry(actionConfig.auditAction, ctx.session.id, ctx.session.email || 'system@abd.com', actionConfig.auditMsg) },
    });

    await logger.audit({
      tenantId: assignment.tenantId,
      action: 'QUIZ_ASSIGNMENT_UPDATE',
      entityType: 'ASSIGNMENT',
      entityId: id,
      userId: ctx.session.id,
      userEmail: ctx.session.email || 'system@abd.com',
      changedFields: actionConfig.update as Record<string, unknown>,
      previousState,
    });

    return { success: true };
  }, {
    tenantIdParam,
    revalidatePaths: '/admin/assignments',
    errorAction: actionConfig.errorAction,
    errorEntityType: 'ASSIGNMENT',
    errorEntityId: id,
    errorLogLabel: actionConfig.errorLogLabel,
  });
}

// Legacy aliases — kept for backward compatibility
export async function archiveAssignmentAction(id: string, tenantIdParam?: string) {
  return updateAssignmentStatusAction(id, 'archive', tenantIdParam);
}

export async function deleteAssignmentAction(id: string, tenantIdParam?: string) {
  return updateAssignmentStatusAction(id, 'delete', tenantIdParam);
}
