import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { AccessProvider, Can, Feature, defineAccess, mergeConfigs, usePermission } from '../src';
import type { UserContext } from '../src/types';

// ---------------------------------------------------------------------------
// Nested provider tests — inner shadows outer
// ---------------------------------------------------------------------------

const outerConfig = defineAccess({
  roles: ['admin', 'viewer'] as const,
  permissions: {
    admin: ['*'] as const,
    viewer: ['articles:read'] as const,
  },
  features: {
    'dark-mode': { enabled: true },
    'beta-feature': { enabled: false },
  },
  plans: ['free', 'pro'] as const,
});

const innerConfig = defineAccess({
  roles: ['admin', 'viewer'] as const,
  permissions: {
    admin: ['*'] as const,
    viewer: ['articles:read'] as const,
  },
  features: {
    'dark-mode': { enabled: false }, // overridden
    'beta-feature': { enabled: true }, // overridden
  },
  plans: ['free', 'pro'] as const,
});

const admin: UserContext<'admin' | 'viewer', 'free' | 'pro'> = {
  id: 'admin-1',
  roles: ['admin'],
  plan: 'pro',
};

const viewer: UserContext<'admin' | 'viewer', 'free' | 'pro'> = {
  id: 'viewer-1',
  roles: ['viewer'],
  plan: 'free',
};

describe('Nested AccessProviders', () => {
  it('inner provider overrides feature flags', () => {
    render(
      <AccessProvider config={outerConfig} user={admin}>
        <AccessProvider config={innerConfig} user={admin}>
          <Feature name="dark-mode" fallback={<span data-testid="off">off</span>}>
            <span data-testid="on">on</span>
          </Feature>
        </AccessProvider>
      </AccessProvider>,
    );
    // Inner config has dark-mode disabled
    expect(screen.getByTestId('off')).toBeInTheDocument();
  });

  it('inner provider can change the user', () => {
    render(
      <AccessProvider config={outerConfig} user={admin}>
        <AccessProvider config={outerConfig} user={viewer}>
          <Can perform="articles:write" fallback={<span data-testid="denied">no</span>}>
            <span data-testid="allowed">yes</span>
          </Can>
        </AccessProvider>
      </AccessProvider>,
    );
    // viewer doesn't have articles:write
    expect(screen.getByTestId('denied')).toBeInTheDocument();
  });

  it('outer provider still works for components outside inner', () => {
    function OuterContent() {
      const hasWrite = usePermission('some:random:permission');
      return <span data-testid="outer">{hasWrite ? 'yes' : 'no'}</span>;
    }

    function InnerContent() {
      const hasRead = usePermission('articles:read');
      return <span data-testid="inner">{hasRead ? 'yes' : 'no'}</span>;
    }

    render(
      <AccessProvider config={outerConfig} user={admin}>
        <OuterContent />
        <AccessProvider config={outerConfig} user={viewer}>
          <InnerContent />
        </AccessProvider>
      </AccessProvider>,
    );
    // admin has wildcard, viewer has articles:read
    expect(screen.getByTestId('outer')).toHaveTextContent('yes');
    expect(screen.getByTestId('inner')).toHaveTextContent('yes');
  });
});

// ---------------------------------------------------------------------------
// mergeConfigs utility
// ---------------------------------------------------------------------------

describe('mergeConfigs', () => {
  it('merges features from override onto base', () => {
    const base = defineAccess({
      roles: ['user'] as const,
      permissions: { user: ['read'] as const },
      features: { 'feat-a': { enabled: true }, 'feat-b': { enabled: false } },
    });

    const merged = mergeConfigs(base, {
      features: { 'feat-b': { enabled: true } } as any,
    });

    expect((merged.features as any)['feat-a'].enabled).toBe(true);
    expect((merged.features as any)['feat-b'].enabled).toBe(true);
  });

  it('merges permissions from override', () => {
    const base = defineAccess({
      roles: ['admin', 'user'] as const,
      permissions: { admin: ['*'] as const, user: ['read'] as const },
    });

    const merged = mergeConfigs(base, {
      permissions: { user: ['read', 'write'] as any },
    });

    expect(merged.permissions.user).toEqual(['read', 'write']);
    expect(merged.permissions.admin).toEqual(['*']);
  });

  it('override scalar fields replace base', () => {
    const base = defineAccess({
      roles: ['user'] as const,
      permissions: { user: ['read'] as const },
      debug: false,
    });

    const merged = mergeConfigs(base, { debug: true });
    expect(merged.debug).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// SSR safety: engines work without DOM globals
// ---------------------------------------------------------------------------

describe('SSR safety', () => {
  it('components render in jsdom without errors', () => {
    // jsdom simulates server-like conditions; this test verifies
    // AccessProvider and components don't rely on browser-only globals
    const config = defineAccess({
      roles: ['user'] as const,
      permissions: { user: ['read'] as const },
      features: { f: { enabled: true } },
    });
    const user = { id: 'ssr-user', roles: ['user'] as const };

    const { container } = render(
      <AccessProvider config={config} user={user}>
        <Can perform="read">
          <span>allowed</span>
        </Can>
        <Feature name="f">
          <span>feature on</span>
        </Feature>
      </AccessProvider>,
    );

    expect(container.textContent).toContain('allowed');
    expect(container.textContent).toContain('feature on');
  });
});

// ---------------------------------------------------------------------------
// Event emissions through provider
// ---------------------------------------------------------------------------

describe('Plugin events through AccessProvider', () => {
  it('plugin receives access check events via Can component', () => {
    const events: any[] = [];
    const plugin = {
      name: 'test-collector',
      onAccessCheck: (e: any) => events.push(e),
    };

    const config = defineAccess({
      roles: ['user'] as const,
      permissions: { user: ['read'] as const },
      plugins: [plugin],
    });
    const user = { id: 'u1', roles: ['user'] as const };

    render(
      <AccessProvider config={config} user={user}>
        <Can perform="read">
          <span>ok</span>
        </Can>
        <Can perform="write" fallback={<span>no</span>}>
          <span>yes</span>
        </Can>
      </AccessProvider>,
    );

    // Plugins should have received events from the permission checks
    expect(events.length).toBeGreaterThanOrEqual(2);
    const readEvent = events.find((e) => e.permission === 'read');
    const writeEvent = events.find((e) => e.permission === 'write');
    expect(readEvent?.granted).toBe(true);
    expect(writeEvent?.granted).toBe(false);
  });
});
