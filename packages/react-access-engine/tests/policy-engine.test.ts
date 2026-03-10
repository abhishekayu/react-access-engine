import { describe, it, expect } from 'vitest';
import { evaluatePolicy } from '../src/engines/policy-engine';
import type { UserContext, PolicyRule } from '../src/types';

const user: UserContext = {
  id: 'user-1',
  roles: ['editor'],
  plan: 'pro',
};

describe('Policy Engine', () => {
  it('returns allow with no policies defined', () => {
    const result = evaluatePolicy('articles:read', user, { policies: [] });
    expect(result.effect).toBe('allow');
    expect(result.matchedRule).toBeNull();
  });

  it('matches by permission scope', () => {
    const policies: PolicyRule[] = [
      { id: 'deny-billing', effect: 'deny', permissions: ['billing:read'] },
    ];
    const result = evaluatePolicy('billing:read', user, { policies });
    expect(result.effect).toBe('deny');
    expect(result.matchedRule).toBe('deny-billing');
  });

  it('does not match unrelated permissions', () => {
    const policies: PolicyRule[] = [
      { id: 'deny-billing', effect: 'deny', permissions: ['billing:read'] },
    ];
    const result = evaluatePolicy('articles:read', user, { policies });
    expect(result.effect).toBe('deny');
    expect(result.reason).toBe('no-matching-rule');
  });

  it('respects priority order', () => {
    const policies: PolicyRule[] = [
      { id: 'allow-all', effect: 'allow', priority: 10 },
      { id: 'deny-all', effect: 'deny', priority: 20 },
    ];
    const result = evaluatePolicy('anything', user, { policies });
    expect(result.effect).toBe('deny');
    expect(result.matchedRule).toBe('deny-all');
  });

  it('evaluates ABAC conditions', () => {
    const policies: PolicyRule[] = [
      {
        id: 'owner-only',
        effect: 'allow',
        permissions: ['articles:edit'],
        condition: ({ user: u, resource }) => u.id === resource['ownerId'],
      },
    ];

    const allowed = evaluatePolicy(
      'articles:edit',
      user,
      { policies },
      {
        resource: { ownerId: 'user-1' },
      },
    );
    expect(allowed.effect).toBe('allow');

    const denied = evaluatePolicy(
      'articles:edit',
      user,
      { policies },
      {
        resource: { ownerId: 'other-user' },
      },
    );
    expect(denied.effect).toBe('deny');
  });

  it('matches by role scope', () => {
    const policies: PolicyRule[] = [{ id: 'admin-only', effect: 'allow', roles: ['admin'] }];
    const result = evaluatePolicy('anything', user, { policies });
    expect(result.effect).toBe('deny');
    expect(result.reason).toBe('no-matching-rule');
  });

  it('matches by plan scope', () => {
    const policies: PolicyRule[] = [
      { id: 'pro-access', effect: 'allow', plans: ['pro', 'enterprise'] },
    ];
    const result = evaluatePolicy('anything', user, { policies });
    expect(result.effect).toBe('allow');
  });

  it('matches by environment', () => {
    const policies: PolicyRule[] = [
      { id: 'prod-deny', effect: 'deny', environments: ['production'] },
    ];
    const result = evaluatePolicy(
      'anything',
      user,
      { policies },
      {
        environment: { name: 'production' },
      },
    );
    expect(result.effect).toBe('deny');
  });

  it('handles condition errors gracefully', () => {
    const policies: PolicyRule[] = [
      {
        id: 'broken-rule',
        effect: 'allow',
        condition: () => {
          throw new Error('boom');
        },
      },
    ];
    const result = evaluatePolicy('anything', user, { policies });
    expect(result.effect).toBe('deny');
    expect(result.reason).toBe('no-matching-rule');
  });
});
