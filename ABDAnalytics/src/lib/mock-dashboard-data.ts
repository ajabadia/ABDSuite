/**
 * @purpose Proporciona una vista previa realista de datos.
 * @purpose_en Generates highly realistic mock data for preview/demo mode in the dashboard.
 * @refactorable false
 * @classification Helper Utility
 * @complexity Low
 * @fingerprint exports:1,imports:1,sig:oedtng
 * @lastUpdated 2026-06-23T22:37:14.108Z
 */

import type { DashboardMetrics } from '@/types/dashboard-metrics';

/**
 * Returns highly realistic mock data for preview/demo mode.
 */
export function getMockDashboardMetrics(): DashboardMetrics {
  return {
    isDemoMode: true,
    suiteSummary: {
      totalStudents: 1420,
      completionRate: 78,
      mfaEnrolledRate: 89,
      storageUsedBytes: 42358000000, // ~42.3 GB
      activeLicensesCount: 3,
      failedLogins24h: 4,
      systemHealth: 'HEALTHY'
    },
    lms: {
      completionRate: 78,
      averageGrade: 74.5,
      gradeDistribution: {
        fail: 8,
        pass: 22,
        remarkable: 55,
        outstanding: 15
      },
      learningCurve: [
        { date: '2026-05-21', averageGrade: 68.2 },
        { date: '2026-05-22', averageGrade: 69.8 },
        { date: '2026-05-23', averageGrade: 71.1 },
        { date: '2026-05-24', averageGrade: 72.4 },
        { date: '2026-05-25', averageGrade: 73.6 },
        { date: '2026-05-26', averageGrade: 74.5 }
      ],
      distractorTelemetry: [
        {
          questionId: 'q-101',
          questionText: '¿Cuál es el puerto por defecto del servicio de analíticas?',
          incorrectRate: 42,
          totalAttempts: 120,
          optionsFrequency: [
            { optionIndex: 0, frequency: 15 }, // Port 3000
            { optionIndex: 1, frequency: 42 }, // Port 3700 (correct but failed rate is high)
            { optionIndex: 2, frequency: 33 }, // Port 3400 (distractor)
            { optionIndex: 3, frequency: 10 }  // Port 80
          ]
        },
        {
          questionId: 'q-102',
          questionText: '¿Qué cabecera HTTP autoriza el SSO inter-servicio?',
          incorrectRate: 35,
          totalAttempts: 120,
          optionsFrequency: [
            { optionIndex: 0, frequency: 35 }, // X-Identity-Token (distractor)
            { optionIndex: 1, frequency: 12 }, // Authorization Bearer
            { optionIndex: 2, frequency: 48 }, // x-internal-iam-key
            { optionIndex: 3, frequency: 5 }  // Cookie
          ]
        }
      ]
    },
    security: {
      totalLogins24h: 3450,
      failedLogins24h: 4,
      mfaEnrolledRate: 89,
      mfaBypassActiveCount: 12,
      failedLoginsTimeline: [
        { hour: '02:00', count: 0 },
        { hour: '06:00', count: 1 },
        { hour: '10:00', count: 0 },
        { hour: '14:00', count: 2 },
        { hour: '18:00', count: 1 },
        { hour: '22:00', count: 0 }
      ]
    },
    governance: {
      totalSpacesCreated: 14,
      activeCollaboratorsCount: 65,
      licensedApps: [
        { appId: 'quiz', status: 'active', expirationDate: '2027-12-31T00:00:00.000Z' },
        { appId: 'auth', status: 'active', expirationDate: '2027-12-31T00:00:00.000Z' },
        { appId: 'gobernanza', status: 'active', expirationDate: '2026-10-15T00:00:00.000Z' }
      ],
      spaceUtilization: [
        { spaceId: 's-1', spaceName: 'Recursos Humanos', totalAssetsCount: 45, storageBytesUsed: 15400000000 },
        { spaceId: 's-2', spaceName: 'Desarrollo de Software', totalAssetsCount: 112, storageBytesUsed: 22100000000 },
        { spaceId: 's-3', spaceName: 'Finanzas e Legal', totalAssetsCount: 22, storageBytesUsed: 4858000000 }
      ]
    }
  };
}
