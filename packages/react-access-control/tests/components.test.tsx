import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  AccessProvider,
  Can,
  Feature,
  AccessGate,
  PermissionGuard,
  FeatureToggle,
  Experiment,
  Allow,
  defineAccess,
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
    'beta-feature': { rolloutPercentage: 100 },
    'disabled-feature': { enabled: false },
  },
  experiments: {
    'checkout-redesign': {
      id: 'checkout-redesign',
      variants: ['control', 'variant-b'] as const,
      defaultVariant: 'control',
      active: true,
    },
    'inactive-experiment': {
      id: 'inactive-experiment',
      variants: ['control', 'v1'] as const,
      defaultVariant: 'control',
      active: false,
    },
  },
  plans: ['free', 'pro', 'enterprise'] as const,
  policies: [
    {
      id: 'owner-only-delete',
      effect: 'allow' as const,
      permissions: ['articles:delete'],
      condition: ({ user, resource }) => resource?.ownerId === user.id,
    },
  ],
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

function Wrapper({
  user,
  cfg,
  children,
}: {
  user: typeof adminUser;
  cfg?: typeof config;
  children: React.ReactNode;
}) {
  return (
    <AccessProvider config={cfg ?? config} user={user}>
      {children}
    </AccessProvider>
  );
}

// ---------------------------------------------------------------------------
// AccessProvider
// ---------------------------------------------------------------------------

describe('AccessProvider', () => {
  it('renders children', () => {
    render(
      <Wrapper user={adminUser}>
        <div data-testid="child">Hello</div>
      </Wrapper>,
    );
    expect(screen.getByTestId('child')).toHaveTextContent('Hello');
  });

  it('nesting: inner provider shadows outer', () => {
    render(
      <Wrapper user={adminUser}>
        <Wrapper user={viewerUser}>
          <Can perform="articles:write" fallback={<span data-testid="denied">no</span>}>
            <span data-testid="allowed">yes</span>
          </Can>
        </Wrapper>
      </Wrapper>,
    );
    // viewer does not have articles:write
    expect(screen.getByTestId('denied')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Can
// ---------------------------------------------------------------------------

describe('Can', () => {
  describe('single permission (perform)', () => {
    it('renders children when permission is granted', () => {
      render(
        <Wrapper user={editorUser}>
          <Can perform="articles:read">
            <span data-testid="content">visible</span>
          </Can>
        </Wrapper>,
      );
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('renders fallback when permission is denied', () => {
      render(
        <Wrapper user={viewerUser}>
          <Can perform="articles:write" fallback={<span data-testid="fallback">denied</span>}>
            <span data-testid="content">visible</span>
          </Can>
        </Wrapper>,
      );
      expect(screen.getByTestId('fallback')).toBeInTheDocument();
      expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    });
  });

  describe('permission alias', () => {
    it('works with the permission prop (alias for perform)', () => {
      render(
        <Wrapper user={editorUser}>
          <Can permission="articles:write">
            <span data-testid="content">visible</span>
          </Can>
        </Wrapper>,
      );
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
  });

  describe('multiple permissions', () => {
    it('mode=all: requires all permissions', () => {
      render(
        <Wrapper user={viewerUser}>
          <Can
            permissions={['articles:read', 'articles:write']}
            mode="all"
            fallback={<span data-testid="fallback">no</span>}
          >
            <span data-testid="content">yes</span>
          </Can>
        </Wrapper>,
      );
      // viewer has articles:read but not articles:write
      expect(screen.getByTestId('fallback')).toBeInTheDocument();
    });

    it('mode=any: requires at least one permission', () => {
      render(
        <Wrapper user={viewerUser}>
          <Can permissions={['articles:read', 'articles:write']} mode="any">
            <span data-testid="content">yes</span>
          </Can>
        </Wrapper>,
      );
      // viewer has articles:read
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
  });

  describe('role checks', () => {
    it('renders when user has the role', () => {
      render(
        <Wrapper user={adminUser}>
          <Can role="admin">
            <span data-testid="content">admin stuff</span>
          </Can>
        </Wrapper>,
      );
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('renders fallback when user does not have the role', () => {
      render(
        <Wrapper user={viewerUser}>
          <Can role="admin" fallback={<span data-testid="fallback">no</span>}>
            <span data-testid="content">admin stuff</span>
          </Can>
        </Wrapper>,
      );
      expect(screen.getByTestId('fallback')).toBeInTheDocument();
    });

    it('multiple roles with mode=any', () => {
      render(
        <Wrapper user={editorUser}>
          <Can roles={['admin', 'editor']} mode="any">
            <span data-testid="content">editor or admin stuff</span>
          </Can>
        </Wrapper>,
      );
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('multiple roles with mode=all (fails when user has only one)', () => {
      render(
        <Wrapper user={editorUser}>
          <Can
            roles={['admin', 'editor']}
            mode="all"
            fallback={<span data-testid="fallback">no</span>}
          >
            <span data-testid="content">both roles</span>
          </Can>
        </Wrapper>,
      );
      // editor does not have admin role
      expect(screen.getByTestId('fallback')).toBeInTheDocument();
    });
  });

  describe('combined checks', () => {
    it('mode=all: role + permission must both pass', () => {
      render(
        <Wrapper user={editorUser}>
          <Can role="editor" perform="articles:write">
            <span data-testid="content">yes</span>
          </Can>
        </Wrapper>,
      );
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('mode=all: role passes but permission fails', () => {
      render(
        <Wrapper user={viewerUser}>
          <Can
            role="viewer"
            perform="articles:write"
            fallback={<span data-testid="fallback">no</span>}
          >
            <span data-testid="content">yes</span>
          </Can>
        </Wrapper>,
      );
      expect(screen.getByTestId('fallback')).toBeInTheDocument();
    });

    it('mode=any: at least one condition passes', () => {
      render(
        <Wrapper user={viewerUser}>
          <Can role="admin" permission="articles:read" mode="any">
            <span data-testid="content">yes</span>
          </Can>
        </Wrapper>,
      );
      // viewer has articles:read, even though role check (admin) fails
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
  });

  describe('no checks specified', () => {
    it('renders children when no conditions are set', () => {
      render(
        <Wrapper user={viewerUser}>
          <Can>
            <span data-testid="content">always visible</span>
          </Can>
        </Wrapper>,
      );
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
  });

  describe('wildcard permissions', () => {
    it('admin with * gets everything', () => {
      render(
        <Wrapper user={adminUser}>
          <Can perform="anything:here">
            <span data-testid="content">admin omniscience</span>
          </Can>
        </Wrapper>,
      );
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('namespace wildcard (comments:*) grants sub-permissions', () => {
      render(
        <Wrapper user={editorUser}>
          <Can perform="comments:delete">
            <span data-testid="content">yes</span>
          </Can>
        </Wrapper>,
      );
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Feature
// ---------------------------------------------------------------------------

describe('Feature', () => {
  it('renders children when feature is enabled', () => {
    render(
      <Wrapper user={adminUser}>
        <Feature name="dark-mode">
          <span data-testid="dark">dark mode on</span>
        </Feature>
      </Wrapper>,
    );
    expect(screen.getByTestId('dark')).toBeInTheDocument();
  });

  it('renders fallback when feature is disabled', () => {
    render(
      <Wrapper user={adminUser}>
        <Feature name="new-editor" fallback={<span data-testid="legacy">old editor</span>}>
          <span data-testid="new">new editor</span>
        </Feature>
      </Wrapper>,
    );
    expect(screen.getByTestId('legacy')).toBeInTheDocument();
    expect(screen.queryByTestId('new')).not.toBeInTheDocument();
  });

  it('renders nothing when feature is disabled and no fallback', () => {
    const { container: _container } = render(
      <Wrapper user={adminUser}>
        <Feature name="disabled-feature">
          <span data-testid="hidden">should not show</span>
        </Feature>
      </Wrapper>,
    );
    expect(screen.queryByTestId('hidden')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// FeatureToggle (render-prop pattern)
// ---------------------------------------------------------------------------

describe('FeatureToggle', () => {
  it('passes enabled=true for enabled features', () => {
    render(
      <Wrapper user={adminUser}>
        <FeatureToggle name="dark-mode">
          {({ enabled }) => <span data-testid="result">{enabled ? 'on' : 'off'}</span>}
        </FeatureToggle>
      </Wrapper>,
    );
    expect(screen.getByTestId('result')).toHaveTextContent('on');
  });

  it('passes enabled=false for disabled features', () => {
    render(
      <Wrapper user={adminUser}>
        <FeatureToggle name="new-editor">
          {({ enabled }) => <span data-testid="result">{enabled ? 'on' : 'off'}</span>}
        </FeatureToggle>
      </Wrapper>,
    );
    expect(screen.getByTestId('result')).toHaveTextContent('off');
  });
});

// ---------------------------------------------------------------------------
// AccessGate
// ---------------------------------------------------------------------------

describe('AccessGate', () => {
  it('renders children when all conditions pass', () => {
    render(
      <Wrapper user={editorUser}>
        <AccessGate permission="articles:read" feature="dark-mode" roles={['editor']}>
          <span data-testid="content">gated content</span>
        </AccessGate>
      </Wrapper>,
    );
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('renders fallback when a condition fails (mode=all)', () => {
    render(
      <Wrapper user={viewerUser}>
        <AccessGate
          permission="articles:write"
          feature="dark-mode"
          fallback={<span data-testid="fallback">access denied</span>}
        >
          <span data-testid="content">gated</span>
        </AccessGate>
      </Wrapper>,
    );
    expect(screen.getByTestId('fallback')).toBeInTheDocument();
  });

  it('mode=any: renders if at least one condition passes', () => {
    render(
      <Wrapper user={viewerUser}>
        <AccessGate permission="articles:write" feature="dark-mode" mode="any">
          <span data-testid="content">any mode</span>
        </AccessGate>
      </Wrapper>,
    );
    // articles:write fails for viewer, but dark-mode is enabled
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('plan-based gating', () => {
    render(
      <Wrapper user={editorUser}>
        <AccessGate plan="pro">
          <span data-testid="content">pro content</span>
        </AccessGate>
      </Wrapper>,
    );
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('renders children when no conditions are set', () => {
    render(
      <Wrapper user={viewerUser}>
        <AccessGate>
          <span data-testid="content">no conditions</span>
        </AccessGate>
      </Wrapper>,
    );
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// PermissionGuard
// ---------------------------------------------------------------------------

describe('PermissionGuard', () => {
  it('renders children when all permissions are granted', () => {
    render(
      <Wrapper user={editorUser}>
        <PermissionGuard permissions={['articles:read', 'articles:write']}>
          <span data-testid="content">authorized</span>
        </PermissionGuard>
      </Wrapper>,
    );
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('renders fallback when any permission is denied', () => {
    render(
      <Wrapper user={viewerUser}>
        <PermissionGuard
          permissions={['articles:read', 'articles:write']}
          fallback={<span data-testid="fallback">403</span>}
        >
          <span data-testid="content">authorized</span>
        </PermissionGuard>
      </Wrapper>,
    );
    expect(screen.getByTestId('fallback')).toBeInTheDocument();
    expect(screen.queryByTestId('content')).not.toBeInTheDocument();
  });

  it('works with admin wildcard', () => {
    render(
      <Wrapper user={adminUser}>
        <PermissionGuard permissions={['users:manage', 'billing:manage', 'system:admin']}>
          <span data-testid="content">admin panel</span>
        </PermissionGuard>
      </Wrapper>,
    );
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Experiment
// ---------------------------------------------------------------------------

describe('Experiment', () => {
  it('renders the assigned variant', () => {
    render(
      <Wrapper user={adminUser}>
        <Experiment
          id="checkout-redesign"
          variants={{
            control: <span data-testid="control">A</span>,
            'variant-b': <span data-testid="variant-b">B</span>,
          }}
        />
      </Wrapper>,
    );
    // Should render one of the variants (deterministic based on user id + experiment id)
    const control = screen.queryByTestId('control');
    const variantB = screen.queryByTestId('variant-b');
    expect(control || variantB).toBeTruthy();
  });

  it('renders fallback when experiment is inactive', () => {
    render(
      <Wrapper user={adminUser}>
        <Experiment
          id="inactive-experiment"
          variants={{
            control: <span>A</span>,
            v1: <span>B</span>,
          }}
          fallback={<span data-testid="fallback">default</span>}
        />
      </Wrapper>,
    );
    expect(screen.getByTestId('fallback')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Error boundary: hooks outside provider
// ---------------------------------------------------------------------------

describe('Hooks outside provider', () => {
  it('throws when Can is used outside AccessProvider', () => {
    // Suppress React error boundary console output
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <Can perform="test">
          <span>content</span>
        </Can>,
      ),
    ).toThrow('[react-access-control]');
    spy.mockRestore();
  });

  it('throws when PermissionGuard is used outside AccessProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <PermissionGuard permissions={['test']}>
          <span>content</span>
        </PermissionGuard>,
      ),
    ).toThrow('[react-access-control]');
    spy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// <Allow> — Unified access gate
// ---------------------------------------------------------------------------

describe('Allow', () => {
  it('renders children when permission is granted', () => {
    render(
      <Wrapper user={adminUser}>
        <Allow permission="articles:read">
          <span data-testid="content">visible</span>
        </Allow>
      </Wrapper>,
    );
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('renders fallback when permission is denied', () => {
    render(
      <Wrapper user={viewerUser}>
        <Allow permission="billing:manage" fallback={<span data-testid="denied">no</span>}>
          <span data-testid="content">visible</span>
        </Allow>
      </Wrapper>,
    );
    expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    expect(screen.getByTestId('denied')).toBeInTheDocument();
  });

  it('checks role', () => {
    render(
      <Wrapper user={adminUser}>
        <Allow role="admin">
          <span data-testid="admin">admin only</span>
        </Allow>
      </Wrapper>,
    );
    expect(screen.getByTestId('admin')).toBeInTheDocument();
  });

  it('denies wrong role', () => {
    render(
      <Wrapper user={viewerUser}>
        <Allow role="admin" fallback={<span data-testid="nope">nope</span>}>
          <span data-testid="admin">admin only</span>
        </Allow>
      </Wrapper>,
    );
    expect(screen.queryByTestId('admin')).not.toBeInTheDocument();
    expect(screen.getByTestId('nope')).toBeInTheDocument();
  });

  it('checks feature flag', () => {
    render(
      <Wrapper user={adminUser}>
        <Allow feature="dark-mode">
          <span data-testid="dark">dark mode</span>
        </Allow>
      </Wrapper>,
    );
    expect(screen.getByTestId('dark')).toBeInTheDocument();
  });

  it('denies disabled feature', () => {
    render(
      <Wrapper user={adminUser}>
        <Allow feature="new-editor" fallback={<span data-testid="off">off</span>}>
          <span data-testid="on">on</span>
        </Allow>
      </Wrapper>,
    );
    expect(screen.queryByTestId('on')).not.toBeInTheDocument();
    expect(screen.getByTestId('off')).toBeInTheDocument();
  });

  it('checks plan tier', () => {
    render(
      <Wrapper user={adminUser}>
        <Allow plan="pro">
          <span data-testid="pro">pro feature</span>
        </Allow>
      </Wrapper>,
    );
    expect(screen.getByTestId('pro')).toBeInTheDocument();
  });

  it('denies insufficient plan', () => {
    render(
      <Wrapper user={viewerUser}>
        <Allow plan="enterprise" fallback={<span data-testid="upgrade">upgrade</span>}>
          <span data-testid="ent">enterprise</span>
        </Allow>
      </Wrapper>,
    );
    expect(screen.queryByTestId('ent')).not.toBeInTheDocument();
    expect(screen.getByTestId('upgrade')).toBeInTheDocument();
  });

  it('combines permission + role + feature (all mode)', () => {
    render(
      <Wrapper user={adminUser}>
        <Allow permission="articles:read" role="admin" feature="dark-mode">
          <span data-testid="all">all pass</span>
        </Allow>
      </Wrapper>,
    );
    expect(screen.getByTestId('all')).toBeInTheDocument();
  });

  it('fails combined checks when one fails (all mode)', () => {
    render(
      <Wrapper user={adminUser}>
        <Allow permission="articles:read" role="admin" feature="new-editor">
          <span data-testid="all">all pass</span>
        </Allow>
      </Wrapper>,
    );
    expect(screen.queryByTestId('all')).not.toBeInTheDocument();
  });

  it('passes combined checks when one passes (any mode)', () => {
    render(
      <Wrapper user={viewerUser}>
        <Allow role="admin" permission="articles:read" match="any">
          <span data-testid="any">any pass</span>
        </Allow>
      </Wrapper>,
    );
    expect(screen.getByTestId('any')).toBeInTheDocument();
  });

  it('renders children when no conditions specified', () => {
    render(
      <Wrapper user={viewerUser}>
        <Allow>
          <span data-testid="open">open</span>
        </Allow>
      </Wrapper>,
    );
    expect(screen.getByTestId('open')).toBeInTheDocument();
  });
});
