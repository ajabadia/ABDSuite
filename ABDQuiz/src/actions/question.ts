/**
 * @purpose Gestiona y procesa acciones relacionadas a preguntas en la aplicación ABDQuiz, incluyendo la recuperación de listas de preguntas paginadas y filtradas, la verificación de la rastreabilidad de las preguntas y el almacenamiento de datos de preguntas actualizados.
 * @purpose_en Manages and processes actions related to questions in the ABDQuiz application, including fetching paginated and filtered question lists, checking question traceability, and saving updated question data.
 * @refactorable true (contains multiple functions with distinct responsibilities)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:3,imports:8,sig:9zqzzg
 * @lastUpdated 2026-06-26T10:01:55.735Z
 */

'use server';

import { QuestionService, type QuestionFilters } from '@/services/corpus/QuestionService';
import { ensureAdminOrProfessor } from '@/lib/auth';
import { type IQuestion } from '@/models/Question';
import { withReadAction, withWriteAction } from '@/lib/actions-wrapper';
import Question from '@/models/Question';
import Course from '@/models/Course';

/**
 * Obtiene el listado paginado y filtrado de preguntas para el tenant activo
 */
export async function getQuestionsAction(
  filters: QuestionFilters,
  tenantIdParam?: string
): Promise<{ questions: IQuestion[]; total: number; page: number; pages: number }> {
  return withReadAction(async (ctx) => {
    const user = await ensureAdminOrProfessor();
    const activeTenantId = ctx.explicitCtx?.tenantId || user.tenantId;

    if (user.role === 'PROFESSOR') {
      const profCourses = await Course.find({ tenantId: activeTenantId, professors: user.id, active: true }, { _id: 1 }).lean();
      filters.courseIds = profCourses.map((c: { _id: unknown }) => String(c._id));
    }

    return QuestionService.getQuestions(activeTenantId, filters);
  }, { tenantIdParam });
}

/**
 * Verifica si un reactivo específico ha sido respondido en exámenes pasados
 */
export async function checkQuestionTraceabilityAction(
  questionId: string,
  tenantIdParam?: string
): Promise<boolean> {
  return withReadAction(async (ctx) => {
    const user = await ensureAdminOrProfessor();
    const oldQuestion = await Question.findById(questionId);
    if (!oldQuestion) {
      throw new Error('Reactivo no encontrado');
    }
    const activeTenantId = ctx.explicitCtx?.tenantId || user.tenantId;
    if (oldQuestion.tenantId !== activeTenantId && user.role !== 'SUPER_ADMIN') {
      throw new Error('Acceso no autorizado');
    }

    if (user.role === 'PROFESSOR' && oldQuestion.courseId) {
      const ownsCourse = await Course.exists({ tenantId: activeTenantId, professors: user.id, _id: oldQuestion.courseId });
      if (!ownsCourse) {
        throw new Error('No tienes permisos para acceder a esta pregunta');
      }
    }

    return QuestionService.checkTraceability(questionId);
  }, { tenantIdParam });
}

/**
 * Guarda o bifurca un reactivo respetando el versionado histórico (Copy-On-Write)
 */
export async function saveQuestionAction(
  questionId: string,
  updatedData: {
    questionText: string;
    options: string[];
    correctOptionIndex: number;
    explanation: string;
    difficulty: 'easy' | 'medium' | 'hard';
    module: string;
    source: string;
    tags: string[];
    attachments?: { url: string; name: string; type: string; size: number }[];
  },
  tenantIdParam?: string
): Promise<import('@/lib/actions-wrapper').ActionResult> {
  return withWriteAction(async (ctx) => {
    const user = await ensureAdminOrProfessor();
    const oldQuestion = await Question.findById(questionId);
    if (!oldQuestion) {
      return { success: false as const, error: 'Reactivo no encontrado' };
    }
    const activeTenantId = ctx.explicitCtx?.tenantId || user.tenantId;
    if (oldQuestion.tenantId !== activeTenantId && user.role !== 'SUPER_ADMIN') {
      return { success: false as const, error: 'Acceso no autorizado' };
    }

    if (user.role === 'PROFESSOR' && oldQuestion.courseId) {
      const ownsCourse = await Course.exists({ tenantId: activeTenantId, professors: user.id, _id: oldQuestion.courseId });
      if (!ownsCourse) {
        return { success: false as const, error: 'No tienes permisos para modificar esta pregunta' };
      }
    }

    const question = await QuestionService.saveQuestion(questionId, updatedData);
    return { success: true as const, data: question };
  }, {
    tenantIdParam,
    revalidatePaths: ['/admin/corpus', '/admin/questions', '/exams'],
    errorAction: 'SAVE_QUESTION_ERROR',
    errorEntityType: 'QUESTION',
    errorEntityId: questionId,
    errorLogLabel: 'SAVE_QUESTION_ACTION_ERROR',
  });
}
