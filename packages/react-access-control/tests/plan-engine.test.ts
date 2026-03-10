import { describe, it, expect } from 'vitest';
import { hasPlanAccess, getPlanTier } from '../src/engines/plan-engine';
import type { UserContext } from '../src/types';

const plans = ['free', 'starter', 'pro', 'enterprise'] as const;
type Plan = (typeof plans)[number];

const config = { plans };

describe('Plan Engine', () => {
  describe('hasPlanAccess', () => {
    it('grants access when user plan meets requirement', () => {
      const user: UserContext<string, Plan> = { id: 'u1', roles: [], plan: 'pro' };
      expect(hasPlanAccess(user, 'pro', config)).toBe(true);
      expect(hasPlanAccess(user, 'starter', config)).toBe(true);
      expect(hasPlanAccess(user, 'free', config)).toBe(true);
    });

    it('denies access when user plan is below requirement', () => {
      const user: UserContext<string, Plan> = { id: 'u2', roles: [], plan: 'starter' };
      expect(hasPlanAccess(user, 'pro', config)).toBe(false);
      expect(hasPlanAccess(user, 'enterprise', config)).toBe(false);
    });

    it('denies access when user has no plan', () => {
      const user: UserContext<string, Plan> = { id: 'u3', roles: [] };
      expect(hasPlanAccess(user, 'free', config)).toBe(false);
    });

    it('allows all when no plan hierarchy defined', () => {
      const user: UserContext = { id: 'u4', roles: [], plan: 'anything' };
      expect(hasPlanAccess(user, 'anything', { plans: undefined })).toBe(true);
    });
  });

  describe('getPlanTier', () => {
    it('returns correct tier index', () => {
      const user: UserContext<string, Plan> = { id: 'u1', roles: [], plan: 'pro' };
      expect(getPlanTier(user, config)).toBe(2);
    });

    it('returns -1 for unknown plan', () => {
      const user: UserContext = { id: 'u1', roles: [], plan: 'unknown' };
      expect(getPlanTier(user, config)).toBe(-1);
    });

    it('returns -1 when no plan set', () => {
      const user: UserContext = { id: 'u1', roles: [] };
      expect(getPlanTier(user, config)).toBe(-1);
    });
  });
});
