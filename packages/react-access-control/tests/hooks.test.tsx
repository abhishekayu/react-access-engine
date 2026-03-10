import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderHook } from '@testing-library/react';
import {
  AccessProvider,
  defineAccess,
  useAccess,
  usePermission,
  useRole,
  useFeature,
  usePolicy,
  useExperiment,
  useAccessDebug,
  usePlan,
} from '../src';
import type { UserContext } from '../src/types';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const config = defineAccess({
  roles: ['admin', 'editor', 'viewer'] as const,
  permissions: {
    admin: ['*'] as const,
    editor: ['articles:read', 'articles:write', 'comments:*'] as const,
    viewer: ['articles:read'] as const,
  },
  features: {
    'dark-mode': { enabled: true },
    'new-editor': { enabled: false },
    'rollout-50': { rolloutPercentage: 50 },
  },
  experiments: {
    'checkout-redesign': {
      id: 'checkout-redesign',
      variants: ['control', 'variant-b'] as const,
      defaultVariant: 'control',
      active: true,
    },
  },
  plans: ['free', 'pro', 'enterprise'] as const,
  policies: [
    {
      id: 'owner-edit',
      effect: 'allow' as const,
      permissions: ['articles:edit'],
      condition: ({ user, resource }) => resource?.ownerId === user.id,
    },
  ],
  debug: true,
});

const adminUser: UserContext<'admin' | 'editor' | 'viewer', 'free' | 'pro' | 'enterprise'> = {
  id: 'admin-1',
  roles: ['admin'],
  plan: 'enterprise',
};

const editorUser: UserContext<'admin' | 'editor' | 'viewer', 'free' | 'pro' | 'enterprise'> = {
  id: 'editor-1',
  roles: ['editor'],
  plan: 'pro',
};

const viewerUser: UserContext<'admin' | 'editor' | 'viewer', 'free' | 'pro' | 'enterprise'> = {
  id: 'viewer-1',
  roles: ['viewer'],
  plan: 'free',
};

type FixtureUser = typeof adminUser;

function createWrapper(user: FixtureUser) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AccessProvider config={config} user={user}>
        {children}
      </AccessProvider>
    );
  };
}

// ---------------------------------------------------------------------------
// useAccess
// ---------------------------------------------------------------------------

describe('useAccess', () => {
  it('returns user, config, roles and permissions', () => {
    const { result } = renderHook(() => useAccess(), {
      wrapper: createWrapper(editorUser),
    });

    expect(result.current.user.id).toBe('editor-1');
    expect(result.current.roles).toEqual(['editor']);
    expect(result.current.permissions).toContain('articles:read');
    expect(result.current.permissions).toContain('articles:write');
  });

  it('exposes checkPermission and checkFeature', () => {
    const { result } = renderHook(() => useAccess(), {
      wrapper: createWrapper(editorUser),
    });

    expect(typeof result.current.checkPermission).toBe('function');
    expect(typeof result.current.checkFeature).toBe('function');
    expect(result.current.checkPermission('articles:read')).toBe(true);
    expect(result.current.checkPermission('billing:read')).toBe(false);
  });

  it('throws outside AccessProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAccess())).toThrow('[react-access-control]');
    spy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// usePermission
// ---------------------------------------------------------------------------

describe('usePermission', () => {
  it('returns true when user has the permission', () => {
    const { result } = renderHook(() => usePermission('articles:read'), {
      wrapper: createWrapper(editorUser),
    });
    expect(result.current).toBe(true);
  });

  it('returns false when user lacks the permission', () => {
    const { result } = renderHook(() => usePermission('billing:manage'), {
      wrapper: createWrapper(viewerUser),
    });
    expect(result.current).toBe(false);
  });

  it('admin wildcard grants everything', () => {
    const { result } = renderHook(() => usePermission('literally:anything'), {
      wrapper: createWrapper(adminUser),
    });
    expect(result.current).toBe(true);
  });

  it('namespace wildcard matches (comments:*)', () => {
    const { result } = renderHook(() => usePermission('comments:anyaction'), {
      wrapper: createWrapper(editorUser),
    });
    expect(result.current).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// useRole
// ---------------------------------------------------------------------------

describe('useRole', () => {
  it('returns the user roles', () => {
    const { result } = renderHook(() => useRole(), {
      wrapper: createWrapper(editorUser),
    });
    expect(result.current.roles).toEqual(['editor']);
  });

  it('hasRole returns true for matching role', () => {
    const { result } = renderHook(() => useRole(), {
      wrapper: createWrapper(adminUser),
    });
    expect(result.current.hasRole('admin')).toBe(true);
    expect(result.current.hasRole('viewer')).toBe(false);
  });

  it('hasAnyRole returns true when user has at least one', () => {
    const { result } = renderHook(() => useRole(), {
      wrapper: createWrapper(editorUser),
    });
    expect(result.current.hasAnyRole(['admin', 'editor'])).toBe(true);
    expect(result.current.hasAnyRole(['admin', 'viewer'])).toBe(false);
  });

  it('hasAllRoles returns true when user has all', () => {
    const multiRoleUser: FixtureUser = {
      id: 'multi',
      roles: ['admin', 'editor'],
      plan: 'pro',
    };
    const { result } = renderHook(() => useRole(), {
      wrapper: createWrapper(multiRoleUser),
    });
    expect(result.current.hasAllRoles(['admin', 'editor'])).toBe(true);
    expect(result.current.hasAllRoles(['admin', 'viewer'])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// useFeature
// ---------------------------------------------------------------------------

describe('useFeature', () => {
  it('returns enabled=true for enabled features', () => {
    const { result } = renderHook(() => useFeature('dark-mode'), {
      wrapper: createWrapper(adminUser),
    });
    expect(result.current.enabled).toBe(true);
    expect(result.current.reason).toBe('static');
  });

  it('returns enabled=false for disabled features', () => {
    const { result } = renderHook(() => useFeature('new-editor'), {
      wrapper: createWrapper(adminUser),
    });
    expect(result.current.enabled).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// usePolicy
// ---------------------------------------------------------------------------

describe('usePolicy', () => {
  it('returns policy evaluation result', () => {
    const { result } = renderHook(() => usePolicy('articles:edit', { ownerId: 'editor-1' }), {
      wrapper: createWrapper(editorUser),
    });
    // The owner-edit policy allows articles:edit when ownerId matches user.id
    expect(result.current.allowed).toBe(true);
  });

  it('denies when condition is not met', () => {
    const { result } = renderHook(() => usePolicy('articles:edit', { ownerId: 'someone-else' }), {
      wrapper: createWrapper(editorUser),
    });
    // Policy condition fails (ownerId !== user.id), default deny
    expect(result.current.allowed).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// useExperiment
// ---------------------------------------------------------------------------

describe('useExperiment', () => {
  it('returns an active experiment assignment', () => {
    const { result } = renderHook(() => useExperiment('checkout-redesign'), {
      wrapper: createWrapper(adminUser),
    });
    expect(result.current.active).toBe(true);
    expect(['control', 'variant-b']).toContain(result.current.variant);
    expect(result.current.experimentId).toBe('checkout-redesign');
  });

  it('returns deterministic variant for same user', () => {
    const { result: r1 } = renderHook(() => useExperiment('checkout-redesign'), {
      wrapper: createWrapper(adminUser),
    });
    const { result: r2 } = renderHook(() => useExperiment('checkout-redesign'), {
      wrapper: createWrapper(adminUser),
    });
    expect(r1.current.variant).toBe(r2.current.variant);
  });
});

// ---------------------------------------------------------------------------
// usePlan
// ---------------------------------------------------------------------------

describe('usePlan', () => {
  it('returns the user plan', () => {
    const { result } = renderHook(() => usePlan(), {
      wrapper: createWrapper(editorUser),
    });
    expect(result.current.plan).toBe('pro');
  });

  it('hasPlanAccess checks tier hierarchy', () => {
    const { result } = renderHook(() => usePlan(), {
      wrapper: createWrapper(editorUser),
    });
    // pro is tier 1, free is tier 0
    expect(result.current.hasPlanAccess('free')).toBe(true);
    expect(result.current.hasPlanAccess('pro')).toBe(true);
    expect(result.current.hasPlanAccess('enterprise')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// useAccessDebug
// ---------------------------------------------------------------------------

describe('useAccessDebug', () => {
  it('returns debug info when debug is enabled', () => {
    const { result } = renderHook(() => useAccessDebug(), {
      wrapper: createWrapper(adminUser),
    });
    expect(result.current).toHaveProperty('lastChecks');
    expect(result.current).toHaveProperty('lastFeatureEvals');
    expect(result.current).toHaveProperty('lastPolicyEvals');
    expect(result.current).toHaveProperty('configSnapshot');
    expect(result.current).toHaveProperty('timestamp');
  });
});

// ---------------------------------------------------------------------------
// useAccess — shorthand methods (can, is, has, tier)
// ---------------------------------------------------------------------------

describe('useAccess shorthand methods', () => {
  it('can() checks permissions', () => {
    const { result } = renderHook(() => useAccess(), {
      wrapper: createWrapper(editorUser),
    });

    expect(result.current.can('articles:read')).toBe(true);
    expect(result.current.can('articles:write')).toBe(true);
    expect(result.current.can('billing:manage')).toBe(false);
  });

  it('can() with admin wildcard grants everything', () => {
    const { result } = renderHook(() => useAccess(), {
      wrapper: createWrapper(adminUser),
    });

    expect(result.current.can('literally:anything')).toBe(true);
  });

  it('is() checks roles', () => {
    const { result } = renderHook(() => useAccess(), {
      wrapper: createWrapper(editorUser),
    });

    expect(result.current.is('editor')).toBe(true);
    expect(result.current.is('admin')).toBe(false);
    expect(result.current.is('viewer')).toBe(false);
  });

  it('has() checks feature flags', () => {
    const { result } = renderHook(() => useAccess(), {
      wrapper: createWrapper(editorUser),
    });

    expect(result.current.has('dark-mode')).toBe(true);
    expect(result.current.has('new-editor')).toBe(false);
  });

  it('tier() checks plan access', () => {
    const { result } = renderHook(() => useAccess(), {
      wrapper: createWrapper(editorUser),
    });

    // editorUser has plan 'pro', so free and pro should be accessible
    expect(result.current.tier('free')).toBe(true);
    expect(result.current.tier('pro')).toBe(true);
    expect(result.current.tier('enterprise')).toBe(false);
  });

  it('tier() with enterprise plan has access to all tiers', () => {
    const { result } = renderHook(() => useAccess(), {
      wrapper: createWrapper(adminUser),
    });

    expect(result.current.tier('free')).toBe(true);
    expect(result.current.tier('pro')).toBe(true);
    expect(result.current.tier('enterprise')).toBe(true);
  });
});
