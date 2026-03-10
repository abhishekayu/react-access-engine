import { describe, it, expect } from 'vitest';
import { evaluateFeature, evaluateAllFeatures } from '../src/engines/feature-engine';
import type { UserContext, AccessConfig } from '../src/types';

const user: UserContext<'admin' | 'editor', 'free' | 'pro'> = {
  id: 'user-123',
  roles: ['editor'],
  plan: 'pro',
};

describe('Feature Engine', () => {
  describe('evaluateFeature', () => {
    it('evaluates simple boolean feature', () => {
      const config = { features: { 'dark-mode': true } as const };
      const result = evaluateFeature('dark-mode', user, config);
      expect(result.enabled).toBe(true);
      expect(result.reason).toBe('static');
    });

    it('evaluates disabled feature', () => {
      const config = { features: { 'dark-mode': false } as const };
      const result = evaluateFeature('dark-mode', user, config);
      expect(result.enabled).toBe(false);
      expect(result.reason).toBe('static');
    });

    it('returns disabled for unknown feature', () => {
      const config = { features: {} };
      const result = evaluateFeature('unknown', user, config);
      expect(result.enabled).toBe(false);
      expect(result.reason).toBe('disabled');
    });

    it('respects role restrictions', () => {
      const config = {
        features: {
          'admin-panel': { enabled: true, allowedRoles: ['admin'] },
        },
      };
      const result = evaluateFeature('admin-panel', user, config);
      expect(result.enabled).toBe(false);
      expect(result.reason).toBe('role');
    });

    it('allows when user has allowed role', () => {
      const config = {
        features: {
          'editor-tools': { enabled: true, allowedRoles: ['editor'] },
        },
      };
      const result = evaluateFeature('editor-tools', user, config);
      expect(result.enabled).toBe(true);
    });

    it('respects plan restrictions', () => {
      const config = {
        features: {
          'pro-feature': { enabled: true, allowedPlans: ['enterprise'] },
        },
      };
      const result = evaluateFeature('pro-feature', user, config);
      expect(result.enabled).toBe(false);
      expect(result.reason).toBe('plan');
    });

    it('allows when user has allowed plan', () => {
      const config = {
        features: {
          'pro-feature': { enabled: true, allowedPlans: ['pro', 'enterprise'] },
        },
      };
      const result = evaluateFeature('pro-feature', user, config);
      expect(result.enabled).toBe(true);
    });

    it('respects environment restrictions', () => {
      const config = {
        features: {
          'staging-only': { enabled: true, allowedEnvironments: ['staging'] },
        },
      };
      const result = evaluateFeature('staging-only', user, config, { name: 'production' });
      expect(result.enabled).toBe(false);
      expect(result.reason).toBe('environment');
    });

    it('handles percentage rollout deterministically', () => {
      const config = {
        features: {
          'new-ui': { rolloutPercentage: 50 },
        },
      };

      // Same user always gets the same result
      const result1 = evaluateFeature('new-ui', user, config);
      const result2 = evaluateFeature('new-ui', user, config);
      expect(result1.enabled).toBe(result2.enabled);
      expect(result1.reason).toBe('rollout');
    });

    it('100% rollout enables for everyone', () => {
      const config = {
        features: {
          'full-rollout': { rolloutPercentage: 100, enabled: true },
        },
      };
      const result = evaluateFeature('full-rollout', user, config);
      expect(result.enabled).toBe(true);
    });

    it('0% rollout disables for everyone', () => {
      const config = {
        features: {
          'no-rollout': { rolloutPercentage: 0 },
        },
      };
      const result = evaluateFeature('no-rollout', user, config);
      expect(result.enabled).toBe(false);
      expect(result.reason).toBe('rollout');
    });

    it('respects feature dependencies', () => {
      const config = {
        features: {
          dependent: { enabled: true, dependencies: ['base-feature'] },
        },
      };
      const resolvedFeatures = new Map([['base-feature', false]]);
      const result = evaluateFeature('dependent', user, config, undefined, resolvedFeatures);
      expect(result.enabled).toBe(false);
      expect(result.reason).toBe('dependency');
    });
  });

  describe('evaluateAllFeatures', () => {
    it('evaluates all features and resolves dependencies', () => {
      const config: Pick<AccessConfig<string, string, string, string>, 'features'> = {
        features: {
          base: true,
          dependent: { enabled: true, dependencies: ['base'] },
          'deep-dependent': { enabled: true, dependencies: ['dependent'] },
        },
      };

      const results = evaluateAllFeatures(user, config);
      expect(results.get('base')?.enabled).toBe(true);
      expect(results.get('dependent')?.enabled).toBe(true);
      expect(results.get('deep-dependent')?.enabled).toBe(true);
    });

    it('detects circular dependencies', () => {
      const config = {
        features: {
          a: { enabled: true, dependencies: ['b'] },
          b: { enabled: true, dependencies: ['a'] },
        },
      };

      const results = evaluateAllFeatures(user, config);
      expect(results.get('a')?.enabled).toBe(false);
      expect(results.get('a')?.reason).toBe('dependency');
      expect(results.get('b')?.enabled).toBe(false);
    });
  });
});
