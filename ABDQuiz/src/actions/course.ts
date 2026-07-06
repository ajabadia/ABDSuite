/**
 * @purpose Gestiona acciones relacionadas con los cursos, como listar, crear, actualizar y eliminar cursos dentro de un inquilino.
 * @purpose_en Manages course-related actions such as listing, creating, updating, and deleting courses within a tenant.
 * @refactorable true (contains multiple business logic functions)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:6,imports:7,sig:wf7a18
 * @lastUpdated 2026-06-26T10:00:50.882Z
 */

'use server';

import { logger } from '@ajabadia/satellite-sdk/logger';
import Course from '@/models/Course';
import { withReadAction, withWriteAction } from '@/lib/actions-wrapper';
import { serializeCourse, type SerializedCourse } from './courseHelpers';

export type { SerializedCourse };

export async function listCoursesAction(spaceId?: string, tenantIdParam?: string) {
  return withReadAction(async (ctx) => {
    const query: Record<string, unknown> = { tenantId: ctx.activeTenantId, active: true };
    if (ctx.session.role === 'PROFESSOR') {
      query.professors = ctx.session.id;
    }
    if (spaceId) query.spaceId = spaceId;

    const docs = await Course.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return docs.map((d) => serializeCourse(d as unknown as Record<string, unknown>));
  }, { tenantIdParam });
}

export async function createCourseAction(
  data: {
    spaceId: string;
    name: string;
    description?: string;
    tags?: string[];
  },
  tenantIdParam?: string
) {
  return withWriteAction(async (ctx) => {
    if (!data.name || data.name.trim() === '') {
      return { success: false, error: 'El nombre del curso es obligatorio' };
    }

    const newCourse = await Course.create({
      tenantId: ctx.activeTenantId,
      spaceId: data.spaceId,
      name: data.name.trim(),
      description: data.description?.trim(),
      tags: data.tags || [],
      learningPath: [],
      active: true,
      createdBy: ctx.session.id,
    });

    await logger.audit({
      tenantId: ctx.activeTenantId,
      action: 'QUIZ_COURSE_CREATED',
      entityType: 'COURSE',
      entityId: newCourse._id.toString(),
      userId: ctx.session.id,
      userEmail: ctx.session.email || 'system@abd.com',
      changedFields: { ...data, tenantId: ctx.activeTenantId },
    });

    return { success: true, id: newCourse._id.toString() } as const;
  }, {
    tenantIdParam,
    revalidatePaths: '/admin/courses',
    errorAction: 'CREATE_COURSE_ERROR',
    errorEntityType: 'COURSE',
    errorLogLabel: 'Error creating course',
  });
}

export async function updateCourseAction(
  id: string,
  data: {
    spaceId?: string;
    name?: string;
    description?: string;
    tags?: string[];
  },
  tenantIdParam?: string
) {
  return withWriteAction(async (ctx) => {
    const course = await Course.findById(id);
    if (!course) {
      return { success: false, error: 'Curso no encontrado' };
    }

    if (course.tenantId !== ctx.activeTenantId && ctx.session.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Acceso no autorizado' };
    }

    if (ctx.session.role === 'PROFESSOR' && !course.professors.includes(ctx.session.id)) {
      return { success: false, error: 'No tienes permisos para modificar este curso' };
    }

    const updateData: Record<string, unknown> = {};
    if (data.spaceId) updateData.spaceId = data.spaceId;
    if (data.name !== undefined) {
      if (data.name.trim() === '') {
        return { success: false, error: 'El nombre del curso no puede estar vacío' };
      }
      updateData.name = data.name.trim();
    }
    if (data.description !== undefined) updateData.description = data.description.trim();
    if (data.tags !== undefined) updateData.tags = data.tags;

    const previousState = course.toObject() as unknown as Record<string, unknown>;
    await Course.findByIdAndUpdate(id, { $set: updateData });

    await logger.audit({
      tenantId: course.tenantId,
      action: 'QUIZ_COURSE_UPDATED',
      entityType: 'COURSE',
      entityId: id,
      userId: ctx.session.id,
      userEmail: ctx.session.email || 'system@abd.com',
      changedFields: updateData,
      previousState,
    });

    return { success: true };
  }, {
    tenantIdParam,
    revalidatePaths: '/admin/courses',
    errorAction: 'UPDATE_COURSE_ERROR',
    errorEntityType: 'COURSE',
    errorEntityId: id,
    errorLogLabel: 'Error updating course',
  });
}

export async function toggleCourseActiveAction(id: string, tenantIdParam?: string) {
  return withWriteAction(async (ctx) => {
    const course = await Course.findById(id);
    if (!course) {
      return { success: false, error: 'Curso no encontrado' };
    }

    if (course.tenantId !== ctx.activeTenantId && ctx.session.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Acceso no autorizado' };
    }

    if (ctx.session.role === 'PROFESSOR' && !course.professors.includes(ctx.session.id)) {
      return { success: false, error: 'No tienes permisos para modificar este curso' };
    }

    const newActive = !course.active;
    const previousState = course.toObject() as unknown as Record<string, unknown>;
    await Course.findByIdAndUpdate(id, { $set: { active: newActive } });

    await logger.audit({
      tenantId: course.tenantId,
      action: 'QUIZ_COURSE_UPDATED',
      entityType: 'COURSE',
      entityId: id,
      userId: ctx.session.id,
      userEmail: ctx.session.email || 'system@abd.com',
      changedFields: { active: newActive },
      previousState,
    });

    return { success: true, active: newActive };
  }, {
    tenantIdParam,
    revalidatePaths: '/admin/courses',
    errorAction: 'TOGGLE_COURSE_ERROR',
    errorEntityType: 'COURSE',
    errorEntityId: id,
    errorLogLabel: 'Error toggling course',
  });
}

export async function deleteCourseAction(id: string, tenantIdParam?: string) {
  return withWriteAction(async (ctx) => {
    const course = await Course.findById(id);
    if (!course) {
      return { success: false, error: 'Curso no encontrado' };
    }

    if (course.tenantId !== ctx.activeTenantId && ctx.session.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Acceso no autorizado' };
    }

    if (ctx.session.role === 'PROFESSOR' && !course.professors.includes(ctx.session.id)) {
      return { success: false, error: 'No tienes permisos para eliminar este curso' };
    }

    const previousState = course.toObject() as unknown as Record<string, unknown>;
    await Course.findByIdAndUpdate(id, { $set: { active: false } });

    await logger.audit({
      tenantId: course.tenantId,
      action: 'QUIZ_COURSE_DELETED',
      entityType: 'COURSE',
      entityId: id,
      userId: ctx.session.id,
      userEmail: ctx.session.email || 'system@abd.com',
      changedFields: { active: false },
      previousState,
    });

    return { success: true };
  }, {
    tenantIdParam,
    revalidatePaths: '/admin/courses',
    errorAction: 'DELETE_COURSE_ERROR',
    errorEntityType: 'COURSE',
    errorEntityId: id,
    errorLogLabel: 'Error deleting course',
  });
}
