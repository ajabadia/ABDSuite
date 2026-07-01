import { describe, it, expect, vi } from 'vitest';
import mongoose from 'mongoose';
import { setupTestEnvironment, mockConnection } from './test-setup';
import { withTenantContext } from '@ajabadia/satellite-sdk/db';
import UserCourseSummary from '../UserCourseSummary';
import CourseAnalytics from '../CourseAnalytics';

setupTestEnvironment();

describe('Multi-Tenant Model Routing', () => {
  it('should route to tenant-specific collection/database when context is active', async () => {
    const tenantCtx = {
      tenantId: 'test-tenant-123',
      dbPrefix: 't123',
      isolationStrategy: 'COLLECTION_PREFIX',
    };

    await withTenantContext(async () => {
      // Accessing a property on the proxy triggers getModelForTenant / getTenantConnection
      UserCourseSummary.find();

      // Verify that compileModelOnConnection was called on mockConnection
      expect(mockConnection.model).toHaveBeenCalled();

      // Under COLLECTION_PREFIX strategy, it should compile with prefixed collection name
      const modelMock = mockConnection.model as unknown as { mock: { calls: [string, unknown, string][] } };
      const lastCallArgs = modelMock.mock.calls[modelMock.mock.calls.length - 1];
      expect(lastCallArgs[0]).toBe('UserCourseSummary');
      expect(lastCallArgs[2]).toBe('t123_usercoursesummaries'); // mongoose pluralizes and lowercases default collections
    }, tenantCtx);
  });

  it('should route to DATABASE_PER_TENANT connection when strategy is set', async () => {
    const tenantCtx = {
      tenantId: 'test-tenant-456',
      dbPrefix: 't456',
      isolationStrategy: 'DATABASE_PER_TENANT',
    };

    const createConnectionSpy = vi.spyOn(mongoose, 'createConnection');

    await withTenantContext(async () => {
      CourseAnalytics.find();

      // It should call mongoose.createConnection with a modified URI containing the tenant database name
      expect(createConnectionSpy).toHaveBeenCalled();
      const callArgs = createConnectionSpy.mock.calls[createConnectionSpy.mock.calls.length - 1] as unknown as string[];
      const uriUsed = callArgs[0];
      expect(uriUsed).toContain('abd_tenant_t456');
    }, tenantCtx);
  });
});
