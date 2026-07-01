import { describe, it, expect, beforeEach } from 'vitest';
import { featureFlags, configureFeatureFlags } from './featureFlags.js';

describe('featureFlags', () => {
  beforeEach(() => {
    // Reset to defaults before each test
    configureFeatureFlags({ liveModeEnabled: true });
  });

  it('should have liveModeEnabled defaulting to true', () => {
    expect(featureFlags.liveModeEnabled).toBe(true);
  });

  it('should allow overriding liveModeEnabled via configureFeatureFlags', () => {
    configureFeatureFlags({ liveModeEnabled: false });
    expect(featureFlags.liveModeEnabled).toBe(false);
  });

  it('should allow re-enabling liveModeEnabled', () => {
    configureFeatureFlags({ liveModeEnabled: false });
    expect(featureFlags.liveModeEnabled).toBe(false);

    configureFeatureFlags({ liveModeEnabled: true });
    expect(featureFlags.liveModeEnabled).toBe(true);
  });
});
