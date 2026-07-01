import { describe, it, expect } from 'vitest';
import { setupTestEnvironment } from './test-setup';
import UserCourseSummary from '../UserCourseSummary';
import CourseAnalytics from '../CourseAnalytics';
import AuthAnalytics from '../AuthAnalytics';
import GovernanceAnalytics from '../GovernanceAnalytics';

setupTestEnvironment();

describe('Model Definitions', () => {
  it('should define UserCourseSummary model with correct schema properties', () => {
    expect(UserCourseSummary).toBeDefined();
    expect(UserCourseSummary.modelName).toBe('UserCourseSummary');
    const paths = UserCourseSummary.schema.paths;
    expect(paths.tenantId).toBeDefined();
    expect(paths.userId).toBeDefined();
    expect(paths.courseId).toBeDefined();
    expect(paths.averageGrade).toBeDefined();
    expect(paths.status).toBeDefined();
  });

  it('should define CourseAnalytics model with correct schema properties', () => {
    expect(CourseAnalytics).toBeDefined();
    expect(CourseAnalytics.modelName).toBe('CourseAnalytics');
    const paths = CourseAnalytics.schema.paths;
    expect(paths.tenantId).toBeDefined();
    expect(paths.courseId).toBeDefined();
    expect(paths.completionRate).toBeDefined();
    expect(paths['gradeDistribution.fail']).toBeDefined();
    expect(paths['gradeDistribution.pass']).toBeDefined();
    expect(paths.distractorTelemetry).toBeDefined();
  });

  it('should define AuthAnalytics model with correct schema properties', () => {
    expect(AuthAnalytics).toBeDefined();
    expect(AuthAnalytics.modelName).toBe('AuthAnalytics');
    const paths = AuthAnalytics.schema.paths;
    expect(paths.tenantId).toBeDefined();
    expect(paths.totalLogins24h).toBeDefined();
    expect(paths.mfaEnrolledRate).toBeDefined();
    expect(paths.failedLoginsTimeline).toBeDefined();
  });

  it('should define GovernanceAnalytics model with correct schema properties', () => {
    expect(GovernanceAnalytics).toBeDefined();
    expect(GovernanceAnalytics.modelName).toBe('GovernanceAnalytics');
    const paths = GovernanceAnalytics.schema.paths;
    expect(paths.tenantId).toBeDefined();
    expect(paths.totalSpacesCreated).toBeDefined();
    expect(paths.licensedApps).toBeDefined();
    expect(paths.spaceUtilization).toBeDefined();
  });
});
