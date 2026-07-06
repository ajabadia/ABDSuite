/**
 * @purpose Gestiona la presentación y resolución de acusaciones técnicas dentro de una prueba, asegurando la autorización adecuada y validando caminos.
 * @purpose_en Manages the submission and resolution of technical allegations within a quiz, ensuring proper authorization and revalidating paths.
 * @refactorable true (contains multiple actions with similar structures)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:4,imports:8,sig:ghcn9r
 * @lastUpdated 2026-06-26T10:00:34.831Z
 */

'use server';

import { AllegationService } from '@/services/allegations/allegationService';
import { ensureAdminOrProfessor } from '@/lib/auth';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';
import { withReadAction, withWriteAction } from '@/lib/actions-wrapper';
import { revalidatePath } from 'next/cache';
import { type IAllegation } from '@/models/Allegation';

/**
 * Registra una reclamación técnica enviada por un alumno
 */
export async function submitAllegationAction(formData: {
  examAttemptId: string;
  questionId: string;
  reason: string;
}) {
  return withWriteAction(async () => {
    const user = await ensureIndustrialAccess();

    const allegation = await AllegationService.submitAllegation(
      user.id,
      user.tenantId,
      user.email,
      `${user.name} ${user.surname}`,
      formData.examAttemptId,
      formData.questionId,
      formData.reason
    );

    revalidatePath(`/quiz/${formData.examAttemptId}`);
    revalidatePath(`/quiz/${formData.examAttemptId}/results`);

    return { success: true as const, data: allegation };
  }, {
    errorAction: 'SUBMIT_ALLEGATION_ERROR',
    errorEntityType: 'ALLEGATION',
    errorEntityId: formData.examAttemptId,
    errorLogLabel: 'SUBMIT_ALLEGATION_ACTION_ERROR',
  });
}

/**
 * Resuelve una reclamación técnica aplicando correcciones y recalculando notas
 */
export async function resolveAllegationAction(formData: {
  allegationId: string;
  resolutionMode: 'CORRECTION_SHIFT' | 'CANCEL_QUESTION' | 'GIVE_POINTS_TO_ALL';
  feedback: string;
  nextCorrectOptionIndex?: number;
}, tenantIdParam?: string) {
  return withWriteAction(async () => {
    const user = await ensureAdminOrProfessor();

    const allegation = await AllegationService.resolveAllegation(
      formData.allegationId,
      formData.resolutionMode,
      formData.feedback,
      `${user.name} ${user.surname}`,
      formData.nextCorrectOptionIndex
    );

    revalidatePath('/admin/allegations');
    revalidatePath('/admin/questions');
    revalidatePath('/admin/corpus');
    revalidatePath('/history');
    revalidatePath('/exams');

    return { success: true as const, data: allegation };
  }, {
    tenantIdParam,
    errorAction: 'RESOLVE_ALLEGATION_ERROR',
    errorEntityType: 'ALLEGATION',
    errorEntityId: formData.allegationId,
    errorLogLabel: 'RESOLVE_ALLEGATION_ACTION_ERROR',
  });
}

/**
 * Rechaza una reclamación directamente
 */
export async function rejectAllegationAction(formData: {
  allegationId: string;
  feedback: string;
}, tenantIdParam?: string) {
  return withWriteAction(async () => {
    const user = await ensureAdminOrProfessor();

    const allegation = await AllegationService.rejectAllegation(
      formData.allegationId,
      formData.feedback,
      `${user.name} ${user.surname}`
    );

    revalidatePath('/admin/allegations');

    return { success: true as const, data: allegation };
  }, {
    tenantIdParam,
    errorAction: 'REJECT_ALLEGATION_ERROR',
    errorEntityType: 'ALLEGATION',
    errorEntityId: formData.allegationId,
    errorLogLabel: 'REJECT_ALLEGATION_ACTION_ERROR',
  });
}

/**
 * Obtiene todas las reclamaciones del tenant del administrador
 */
export async function getTenantAllegationsAction(tenantIdParam?: string) {
  return withReadAction(async (ctx) => {
    const user = await ensureAdminOrProfessor();
    const activeTenantId = ctx.explicitCtx?.tenantId || user.tenantId;
    return AllegationService.getTenantAllegations(activeTenantId);
  }, { tenantIdParam });
}
