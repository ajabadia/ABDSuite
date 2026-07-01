/**
 * @purpose Gestiona y consolidación de métricas para el panel de dashboard del inquilino activo, maneja tanto datos reales como datos de mockeo.
 * @purpose_en Fetches and consolidates metrics for the active tenant's dashboard, handling both real data and fallback mock data.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:1,imports:7,sig:1r4m06a
 * @lastUpdated 2026-06-23T22:36:45.356Z
 */

'use server';

import { withTenantContext } from '@ajabadia/satellite-sdk/db';
import type { DashboardMetrics } from '@/types/dashboard-metrics';
import { getMockDashboardMetrics } from '@/lib/mock-dashboard-data';
import UserCourseSummary from '@/models/UserCourseSummary';
import CourseAnalytics from '@/models/CourseAnalytics';
import AuthAnalytics from '@/models/AuthAnalytics';
import GovernanceAnalytics from '@/models/GovernanceAnalytics';

/**
 * 🛰️ Server Action to fetch metrics for the active tenant.
 * Automatically wraps queries in `withTenantContext` and falls back to structured mock data if counts are 0.
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  return await withTenantContext(async () => {
    try {
      // 1. Gather counts/documents from the dynamic tenant connection
      const [userSummaries, courses, authDoc, govDoc] = await Promise.all([
        UserCourseSummary.find({}).lean(),
        CourseAnalytics.find({}).lean(),
        AuthAnalytics.findOne({}).lean(),
        GovernanceAnalytics.findOne({}).lean()
      ]);

      const hasRealData = userSummaries.length > 0 || courses.length > 0 || !!authDoc || !!govDoc;

      if (!hasRealData) {
        return getMockDashboardMetrics();
      }

      // 2. Parse and consolidate database documents
      const totalStudents = userSummaries.length;
      const completedStudents = userSummaries.filter(u => u.status === 'completed').length;
      const dbCompletionRate = totalStudents > 0 ? Math.round((completedStudents / totalStudents) * 100) : 0;

      const failedLogins24h = authDoc?.failedLogins24h ?? 0;
      const mfaEnrolledRate = authDoc?.mfaEnrolledRate ?? 0;
      const totalLogins24h = authDoc?.totalLogins24h ?? 0;
      const mfaBypassActiveCount = authDoc?.mfaBypassActiveCount ?? 0;
      const failedLoginsTimeline = authDoc?.failedLoginsTimeline ?? [];

      const totalSpacesCreated = govDoc?.totalSpacesCreated ?? 0;
      const activeCollaboratorsCount = govDoc?.activeCollaboratorsCount ?? 0;
      const licensedApps = (govDoc?.licensedApps ?? []).map(app => ({
        appId: app.appId,
        status: app.status,
        expirationDate: app.expirationDate?.toISOString()
      }));
      const spaceUtilization = govDoc?.spaceUtilization ?? [];
      const storageUsedBytes = spaceUtilization.reduce((acc, curr) => acc + curr.storageBytesUsed, 0);

      const mainCourse = courses[0];
      const completionRate = mainCourse?.completionRate ?? dbCompletionRate;
      const averageGrade = mainCourse?.averageGrade ?? 0;
      const gradeDistribution = mainCourse?.gradeDistribution ?? { fail: 0, pass: 0, remarkable: 0, outstanding: 0 };
      const learningCurve = mainCourse?.learningCurve ?? [];
      const distractorTelemetry = mainCourse?.distractorTelemetry ?? [];

      const systemHealth: 'HEALTHY' | 'WARNING' | 'CRITICAL' = failedLogins24h > 20 ? 'WARNING' : 'HEALTHY';

      return {
        isDemoMode: false,
        suiteSummary: {
          totalStudents: totalStudents || activeCollaboratorsCount,
          completionRate,
          mfaEnrolledRate,
          storageUsedBytes,
          activeLicensesCount: licensedApps.filter(a => a.status === 'active').length,
          failedLogins24h,
          systemHealth
        },
        lms: {
          completionRate,
          averageGrade,
          gradeDistribution,
          learningCurve,
          distractorTelemetry: distractorTelemetry.map(d => ({
            questionId: d.questionId,
            questionText: d.questionText,
            incorrectRate: d.incorrectRate,
            totalAttempts: d.totalAttempts,
            optionsFrequency: d.optionsFrequency ?? []
          }))
        },
        security: {
          totalLogins24h,
          failedLogins24h,
          mfaEnrolledRate,
          mfaBypassActiveCount,
          failedLoginsTimeline
        },
        governance: {
          totalSpacesCreated,
          activeCollaboratorsCount,
          licensedApps,
          spaceUtilization
        }
      };
    } catch (err) {
      console.error('[DashboardActions] Error querying db, falling back to preview mock data:', err);
      return getMockDashboardMetrics();
    }
  });
}
