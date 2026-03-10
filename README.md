<div align="center">

# react-access-control

**Unified access control, feature flags, and policy engine for React.**

[![npm version](https://img.shields.io/npm/v/react-access-control?color=blue&label=npm)](https://www.npmjs.com/package/react-access-control)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/react-access-control?label=minzipped)](https://bundlephobia.com/package/react-access-control)
[![CI](https://github.com/abhishekayu/react-access-engine/actions/workflows/ci.yml/badge.svg)](https://github.com/abhishekayu/react-access-engine/actions/workflows/ci.yml)
[![codecov](https://img.shields.io/badge/tests-202%20passing-brightgreen)](https://github.com/abhishekayu/react-access-engine)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![license](https://img.shields.io/npm/l/react-access-control)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[Documentation](https://react-access-control.dev) · [Playground](https://react-access-control.dev/playground) · [Examples](https://github.com/abhishekayu/react-access-engine/tree/main/examples)

</div>

---

## Why?

React apps cobble together homegrown RBAC, a feature flag service, ad-hoc plan gating, and manual A/B test wiring — each with its own provider, API, and blind spots.

**react-access-control** replaces all of them with one system:

```tsx
<Can perform="billing:edit" on={{ ownerId: user.id }}>
  <Feature name="new-invoice-editor" fallback={<LegacyEditor />}>
    <InvoiceEditor />
  </Feature>
</Can>
```

## Features

| Category              | What you get                                                                                             |
| --------------------- | -------------------------------------------------------------------------------------------------------- |
| **RBAC**              | Multi-role users, role → permission mapping, wildcard permissions (`*`, `namespace:*`)                   |
| **ABAC**              | Attribute-based policies with composable allow/deny rules, priority ordering, custom condition operators |
| **Feature Flags**     | Boolean toggles, percentage rollouts, role/plan/environment targeting, feature dependencies              |
| **Experiments**       | A/B testing with deterministic variant assignment, SSR-safe hashing, allocation control                  |
| **Plan Gating**       | Hierarchical subscription tiers with automatic comparison                                                |
| **Remote Config**     | Fetch config from API with stale-while-revalidate, polling, and signature verification                   |
| **Plugin System**     | Lifecycle hooks for audit logging, analytics, custom condition operators                                 |
| **DevTools**          | Optional overlay for inspecting access decisions, feature evaluations, policy traces                     |
| **Type Safety**       | Full TypeScript inference — `InferRoles`, `InferPermissions`, `InferFeatures` from config                |
| **SSR-Ready**         | Deterministic evaluation, no `window`/`Math.random()`, works with Next.js App Router                     |
| **Tree-Shakeable**    | Import only what you use — unused engines are eliminated at build time                                   |
| **Zero Dependencies** | No runtime dependencies beyond React                                                                     |

## Installation

```bash
npm install react-access-control
# or
pnpm add react-access-control
# or
yarn add react-access-control
```

> Requires `react >= 18` as a peer dependency.

## Quick Start

### 1. Define your config

```typescript
import { defineAccess } from 'react-access-control';

const config = defineAccess({
  roles: ['admin', 'editor', 'viewer'] as const,

  permissions: {
    admin: ['*'] as const,
    editor: ['articles:read', 'articles:write', 'comments:*'] as const,
    viewer: ['articles:read'] as const,
  },

  features: {
    'dark-mode': { enabled: true },
    'new-editor': { rolloutPercentage: 50 },
    'analytics-v2': { enabled: true, allowedPlans: ['pro', 'enterprise'] },
  },

  plans: ['free', 'starter', 'pro', 'enterprise'] as const,
});
```

### 2. Wrap your app

```tsx
import { AccessProvider } from 'react-access-control';

function App() {
  const user = {
    id: 'user-123',
    roles: ['editor'] as const,
    plan: 'pro' as const,
  };

  return (
    <AccessProvider config={config} user={user}>
      <Dashboard />
    </AccessProvider>
  );
}
```

### 3. Use components and hooks

```tsx
import { Can, Feature, usePermission, useFeature } from 'react-access-control';

function Dashboard() {
  const canManageUsers = usePermission('users:manage');

  return (
    <div>
      <Can perform="articles:write">
        <button>New Article</button>
      </Can>

      <Feature name="analytics-v2" fallback={<LegacyAnalytics />}>
        <AnalyticsV2 />
      </Feature>

      {canManageUsers && <UserManagement />}
    </div>
  );
}
```

## API Reference

### Components

#### `<AccessProvider>`

Root provider. Initializes all engines and provides context.

```tsx
<AccessProvider config={config} user={user}>
  {children}
</AccessProvider>
```

#### `<Can>`

Permission gate. Renders children only if the user has the permission.

```tsx
<Can perform="articles:edit" on={{ ownerId: article.ownerId }} fallback={<ReadOnly />}>
  <Editor />
</Can>
```

#### `<Feature>`

Feature flag gate. Renders children only if the feature is enabled.

```tsx
<Feature name="new-editor" fallback={<LegacyEditor />}>
  <NewEditor />
</Feature>
```

#### `<AccessGate>`

Multi-condition gate. Combines permission, feature, role, and plan checks.

```tsx
<AccessGate
  permission="analytics:view"
  feature="analytics-v2"
  plan="pro"
  roles={['admin', 'editor']}
  mode="all"
  fallback={<UpgradePrompt />}
>
  <AnalyticsDashboard />
</AccessGate>
```

#### `<PermissionGuard>`

Route-level guard. Requires ALL specified permissions.

```tsx
<PermissionGuard permissions={['admin:access', 'users:manage']} fallback={<NotAuthorized />}>
  <AdminPage />
</PermissionGuard>
```

#### `<FeatureToggle>`

Render prop for feature flags. Use when you need the state value.

```tsx
<FeatureToggle name="new-pricing">
  {({ enabled }) => <PricingPage variant={enabled ? 'new' : 'legacy'} />}
</FeatureToggle>
```

#### `<Experiment>`

A/B testing component. Renders the assigned variant.

```tsx
<Experiment
  id="checkout-redesign"
  variants={{
    control: <CheckoutA />,
    'variant-b': <CheckoutB />,
  }}
  fallback={<CheckoutA />}
/>
```

### Hooks

| Hook                             | Returns                                       | Purpose                                         |
| -------------------------------- | --------------------------------------------- | ----------------------------------------------- |
| `useAccess()`                    | Full context                                  | Access all config, user data, and check methods |
| `usePermission(perm, resource?)` | `boolean`                                     | Check a single permission                       |
| `useRole()`                      | `{ roles, hasRole, hasAnyRole, hasAllRoles }` | Role checking utilities                         |
| `useFeature(name)`               | `{ enabled, reason }`                         | Check a feature flag                            |
| `usePolicy(perm, resource?)`     | `{ allowed, matchedRule, reason }`            | Evaluate policy rules                           |
| `useExperiment(id)`              | `{ variant, active, experimentId }`           | Get experiment assignment                       |
| `usePlan()`                      | `{ plan, hasPlanAccess }`                     | Subscription plan checks                        |
| `useAccessDebug()`               | `AccessDebugInfo`                             | Debug metadata (when `debug: true`)             |

## Advanced Usage

### Policy Engine (ABAC)

Define composable allow/deny rules:

```typescript
const config = defineAccess({
  roles: ['admin', 'editor', 'viewer'] as const,
  permissions: {
    admin: ['*'] as const,
    editor: ['articles:read', 'articles:write'] as const,
    viewer: ['articles:read'] as const,
  },
  policies: [
    {
      id: 'owner-can-edit',
      effect: 'allow',
      permissions: ['articles:edit'],
      condition: ({ user, resource }) => user.id === resource.ownerId,
      description: 'Users can edit their own articles',
    },
    {
      id: 'deny-in-production',
      effect: 'deny',
      permissions: ['debug:*'],
      environments: ['production'],
      priority: 100,
      description: 'Disable debug in production',
    },
  ],
});
```

### Percentage Rollouts

```typescript
features: {
  'new-ui': { rolloutPercentage: 25 },         // 25% of users
  'beta-editor': {
    rolloutPercentage: 50,
    allowedRoles: ['editor', 'admin'],          // 50% of editors/admins only
  },
}
```

Rollouts are deterministic — the same user always sees the same result (based on user ID hash).

### Feature Dependencies

```typescript
features: {
  'base-analytics': { enabled: true },
  'advanced-charts': {
    enabled: true,
    dependencies: ['base-analytics'],           // Only active if base-analytics is enabled
  },
}
```

### Subscription/Plan Gating

```typescript
const config = defineAccess({
  // ...
  plans: ['free', 'starter', 'pro', 'enterprise'] as const,
  features: {
    'advanced-export': { enabled: true, allowedPlans: ['pro', 'enterprise'] },
  },
});

// In components:
const { hasPlanAccess } = usePlan();
if (hasPlanAccess('pro')) {
  /* show pro features */
}
```

### Plugin System

```typescript
const auditPlugin: AccessPlugin = {
  name: 'audit-logger',
  onAccessCheck: (event) => {
    console.log(`[AUDIT] ${event.permission}: ${event.granted ? 'GRANTED' : 'DENIED'}`);
  },
  onFeatureEvaluate: (event) => {
    analytics.track('feature_check', {
      feature: event.feature,
      enabled: event.enabled,
    });
  },
};

const config = defineAccess({
  // ...
  plugins: [auditPlugin],
});
```

### Experiments / A/B Testing

```typescript
const config = defineAccess({
  // ...
  experiments: {
    'checkout-flow': {
      id: 'checkout-flow',
      variants: ['control', 'streamlined', 'one-page'] as const,
      defaultVariant: 'control',
      active: true,
      allocation: { control: 34, streamlined: 33, 'one-page': 33 },
    },
  },
});

// In component:
const { variant } = useExperiment('checkout-flow');
```

### Debug Mode

```typescript
const config = defineAccess({
  // ...
  debug: true,
});

// In a dev overlay:
const debugInfo = useAccessDebug();
console.log(debugInfo.lastChecks); // Recent permission checks
console.log(debugInfo.lastFeatureEvals); // Recent feature evaluations
```

## Real-World Examples

### SaaS Dashboard

```tsx
function SaasDashboard() {
  return (
    <AccessProvider config={saasConfig} user={currentUser}>
      <Sidebar>
        <Can perform="dashboard:view">
          <NavLink to="/dashboard">Dashboard</NavLink>
        </Can>
        <Can perform="analytics:view">
          <Feature name="analytics-v2">
            <NavLink to="/analytics">Analytics</NavLink>
          </Feature>
        </Can>
        <Can perform="billing:manage">
          <NavLink to="/billing">Billing</NavLink>
        </Can>
      </Sidebar>

      <AccessGate permission="settings:manage" plan="pro" fallback={<UpgradePrompt />}>
        <AdvancedSettings />
      </AccessGate>
    </AccessProvider>
  );
}
```

### Admin Dashboard with Multi-Role

```tsx
const adminConfig = defineAccess({
  roles: ['super-admin', 'admin', 'moderator', 'support'] as const,
  permissions: {
    'super-admin': ['*'] as const,
    admin: ['users:*', 'content:*', 'settings:read'] as const,
    moderator: ['content:read', 'content:moderate', 'reports:read'] as const,
    support: ['users:read', 'tickets:*'] as const,
  },
});

function AdminPanel() {
  return (
    <PermissionGuard
      permissions={['users:read']}
      fallback={<div>You do not have access to admin</div>}
    >
      <UserTable />
      <Can perform="users:delete">
        <BulkDeleteButton />
      </Can>
    </PermissionGuard>
  );
}
```

### Subscription-Gated App

```tsx
const config = defineAccess({
  roles: ['user'] as const,
  permissions: { user: ['app:access'] as const },
  plans: ['free', 'pro', 'enterprise'] as const,
  features: {
    'export-csv': { enabled: true, allowedPlans: ['pro', 'enterprise'] },
    'api-access': { enabled: true, allowedPlans: ['enterprise'] },
    'custom-branding': { enabled: true, allowedPlans: ['enterprise'] },
  },
});

function ExportButton() {
  return (
    <Feature name="export-csv" fallback={<UpgradeBanner plan="pro" />}>
      <button>Export CSV</button>
    </Feature>
  );
}
```

## SSR / Next.js

react-access-control is SSR-safe by design:

- All hooks return deterministic values (no `useEffect` for initial state)
- No `window`/`document`/`localStorage` access in core evaluation
- Rollouts use user ID hashing, not `Math.random()`
- All components use `'use client'` directive for App Router compatibility

```tsx
// app/layout.tsx (Next.js App Router)
import { AccessProvider } from 'react-access-control';

export default function RootLayout({ children }) {
  const user = await getServerUser(); // Your server-side user fetching
  return (
    <AccessProvider config={config} user={user}>
      {children}
    </AccessProvider>
  );
}
```

## TypeScript

The `defineAccess` factory infers literal types from your config:

```typescript
const config = defineAccess({
  roles: ['admin', 'editor'] as const,
  permissions: {
    admin: ['users:manage', 'billing:read'] as const,
    editor: ['articles:write'] as const,
  },
  features: {
    'dark-mode': true,
    'new-editor': { enabled: true },
  },
});

// InferRoles<typeof config> = 'admin' | 'editor'
// InferPermissions<typeof config> = 'users:manage' | 'billing:read' | 'articles:write'
// InferFeatures<typeof config> = 'dark-mode' | 'new-editor'
```

## Architecture

```
┌──────────────────────────────────────────────────┐
│                 AccessProvider                    │
│                                                  │
│  ┌───────────┐ ┌────────────┐ ┌───────────────┐  │
│  │ Role      │ │ Permission │ │ Policy Engine │  │
│  │ Engine    │ │ Engine     │ │ (ABAC rules)  │  │
│  └───────────┘ └────────────┘ └───────────────┘  │
│                                                  │
│  ┌───────────┐ ┌────────────┐ ┌───────────────┐  │
│  │ Feature   │ │ Experiment │ │ Plan Engine   │  │
│  │ Engine    │ │ Engine     │ │               │  │
│  └───────────┘ └────────────┘ └───────────────┘  │
│                                                  │
│  ┌───────────┐ ┌────────────┐                    │
│  │ Plugin    │ │ Debug      │                    │
│  │ Engine    │ │ Engine     │                    │
│  └───────────┘ └────────────┘                    │
└──────────────────────────────────────────────────┘
```

Each engine is a pure function module. Unused engines are tree-shaken from bundles.

## Monorepo Structure

```
react-access-engine/
├── packages/
│   ├── react-access-control/  # Core library (published to npm)
│   ├── devtools/              # Dev overlay for inspecting access decisions
│   └── shared/                # Internal shared utilities
├── apps/
│   ├── docs/                  # Next.js documentation site
│   └── playground/            # Interactive playground
├── examples/
│   ├── basic/                 # Simple RBAC example
│   ├── nextjs/                # Next.js App Router integration
│   ├── saas-dashboard/        # SaaS with plan gating & multi-role
│   ├── feature-rollout/       # Percentage rollouts & feature gates
│   ├── experiments/           # A/B testing with Experiment component
│   └── abac-policies/         # ABAC policy engine patterns
├── .github/workflows/         # CI, release, and docs pipelines
├── .changeset/                # Changesets for version management
└── turbo.json                 # Turborepo task config
```

### Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Type-check
pnpm typecheck

# Start playground
pnpm --filter playground dev

# Start docs
pnpm --filter docs dev
```

### Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines. Quick version:

1. Fork the repo and create a feature branch from `main`
2. Run `pnpm install` and `pnpm build`
3. Make your changes with tests
4. Run `pnpm changeset` to describe your changes
5. Submit a pull request

All contributions — from bug reports to documentation to code — are welcome.

## Comparison

| Feature              | react-access-control | RBAC Library | Feature Flag Service | DIY |
| -------------------- | :------------------: | :----------: | :------------------: | :-: |
| RBAC with wildcards  |          ✅          |      ✅      |          ❌          | ⚠️  |
| ABAC / Policy engine |          ✅          |      ❌      |          ❌          | ⚠️  |
| Feature flags        |          ✅          |      ❌      |          ✅          | ❌  |
| A/B Experiments      |          ✅          |      ❌      |          ⚠️          | ❌  |
| Plan gating          |          ✅          |      ❌      |          ❌          | ⚠️  |
| Remote config        |          ✅          |      ❌      |          ✅          | ❌  |
| Plugin system        |          ✅          |      ❌      |          ❌          | ❌  |
| DevTools overlay     |          ✅          |      ❌      |          ⚠️          | ❌  |
| SSR-safe (Next.js)   |          ✅          |      ⚠️      |          ⚠️          | ⚠️  |
| Tree-shakeable       |          ✅          |      ✅      |          ❌          | ✅  |
| Zero dependencies    |          ✅          |      ✅      |          ❌          | ✅  |
| Type-safe inference  |          ✅          |      ❌      |          ❌          | ⚠️  |

## Community

- [Documentation](https://react-access-control.dev)
- [GitHub Discussions](https://github.com/abhishekayu/react-access-engine/discussions) — Questions & ideas
- [Issue Tracker](https://github.com/abhishekayu/react-access-engine/issues) — Bug reports & feature requests
- [Changelog](https://github.com/abhishekayu/react-access-engine/blob/main/packages/react-access-control/CHANGELOG.md)

## Sponsors

If react-access-control saves you time, consider [sponsoring the project](https://github.com/sponsors/abhishekayu).

## License

[MIT](LICENSE) © [Abhishek](https://github.com/abhishekayu)
