<div align="center">

# react-access-engine

**Unified access control, feature flags, and policy engine for React.**

[![npm version](https://img.shields.io/npm/v/react-access-engine?color=blue&label=npm)](https://www.npmjs.com/package/react-access-engine)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/react-access-engine?label=minzipped)](https://bundlephobia.com/package/react-access-engine)
[![CI](https://github.com/abhishekayu/react-access-engine/actions/workflows/ci.yml/badge.svg)](https://github.com/abhishekayu/react-access-engine/actions/workflows/ci.yml)
[![codecov](https://img.shields.io/badge/tests-220%20passing-brightgreen)](https://github.com/abhishekayu/react-access-engine)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![license](https://img.shields.io/npm/l/react-access-engine)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[Documentation](https://react-access-engine.dev) · [Playground](https://react-access-engine.dev/playground) · [Examples](https://github.com/abhishekayu/react-access-engine/tree/main/examples)

</div>

---

## Why?

React apps cobble together homegrown RBAC, a feature flag service, ad-hoc plan gating, and manual A/B test wiring — each with its own provider, API, and blind spots.

**react-access-engine** replaces all of them with one system — and keeps it simple:

```tsx
const { can, is, has, tier } = useAccess();

can('edit'); // check permission
is('admin'); // check role
has('dark-mode'); // check feature flag
tier('pro'); // check plan
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
npm install react-access-engine
# or
pnpm add react-access-engine
# or
yarn add react-access-engine
```

> Requires `react >= 18` as a peer dependency.

## Quick Start

### 1. Define your config

```typescript
import { defineAccess } from 'react-access-engine';

const config = defineAccess({
  roles: ['admin', 'editor', 'viewer'],
  permissions: {
    admin: ['*'],
    editor: ['articles:read', 'articles:write'],
    viewer: ['articles:read'],
  },
  features: {
    'dark-mode': true,
    'new-editor': { rolloutPercentage: 50 },
  },
  plans: ['free', 'pro', 'enterprise'],
});
```

### 2. Wrap your app

```tsx
import { AccessProvider } from 'react-access-engine';

function App() {
  return (
    <AccessProvider config={config} user={{ id: 'user-123', roles: ['editor'], plan: 'pro' }}>
      <Dashboard />
    </AccessProvider>
  );
}
```

### 3. Use it

**One hook — `useAccess()` — does everything:**

```tsx
import { useAccess } from 'react-access-engine';

function Dashboard() {
  const { can, is, has, tier } = useAccess();

  return (
    <div>
      {can('articles:write') && <button>New Article</button>}
      {is('admin') && <AdminPanel />}
      {has('dark-mode') && <DarkModeToggle />}
      {tier('pro') && <ProFeatures />}
    </div>
  );
}
```

**Or use `<Allow>` — one component for all access control:**

```tsx
import { Allow } from 'react-access-engine';

function Dashboard() {
  return (
    <div>
      <Allow permission="articles:write">
        <button>New Article</button>
      </Allow>

      <Allow role="admin">
        <AdminPanel />
      </Allow>

      <Allow feature="dark-mode">
        <DarkModeToggle />
      </Allow>

      <Allow plan="pro" fallback={<UpgradePrompt />}>
        <ProFeatures />
      </Allow>

      {/* Combine conditions — all must pass */}
      <Allow permission="analytics:view" feature="analytics-v2" plan="pro">
        <AnalyticsDashboard />
      </Allow>
    </div>
  );
}
```

That's it. One hook, one component. No need to memorize anything else.

## API Reference

### `useAccess()` — The Only Hook You Need

```tsx
const { can, is, has, tier, user, roles, permissions } = useAccess();
```

| Method                 | Returns   | Purpose                                            |
| ---------------------- | --------- | -------------------------------------------------- |
| `can(perm, resource?)` | `boolean` | Check a permission (with optional ABAC resource)   |
| `is(role)`             | `boolean` | Check if user has a role                           |
| `has(feature)`         | `boolean` | Check if a feature flag is enabled                 |
| `tier(plan)`           | `boolean` | Check if user's plan meets or exceeds the required |

Also exposes `user`, `roles`, `permissions`, `checkPermission`, `checkFeature`, `getExperiment` for advanced use.

### `<Allow>` — The Only Component You Need

```tsx
<Allow
  permission="edit" // permission check (optional)
  role="admin" // role check (optional)
  feature="dark-mode" // feature flag check (optional)
  plan="pro" // plan tier check (optional)
  on={{ ownerId: id }} // resource for ABAC (optional)
  match="all" // "all" (default) or "any"
  fallback={<Upgrade />} // shown when denied (optional)
>
  <ProtectedContent />
</Allow>
```

Every prop is optional. Use only what you need. Combine freely.

### Specialized Components

For specific use cases, these focused components are also available:

#### `<Can>`

Permission gate with roles, policy, and multi-permission support.

```tsx
<Can perform="articles:edit" on={{ ownerId: article.ownerId }} fallback={<ReadOnly />}>
  <Editor />
</Can>
```

#### `<Feature>`

Feature flag gate.

```tsx
<Feature name="new-editor" fallback={<LegacyEditor />}>
  <NewEditor />
</Feature>
```

#### `<Experiment>`

A/B testing component.

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

#### `<AccessGate>`

Multi-condition gate (like `<Allow>` but with `mode` instead of `match`).

#### `<PermissionGuard>`

Route-level guard requiring ALL permissions to pass.

#### `<FeatureToggle>`

Render-prop variant of `<Feature>` — use when you need the `enabled` value.

### Specialized Hooks

When you need more detail than `useAccess()` provides:

| Hook                             | Returns                                       | Purpose                             |
| -------------------------------- | --------------------------------------------- | ----------------------------------- |
| `usePermission(perm, resource?)` | `boolean`                                     | Check a single permission           |
| `useRole()`                      | `{ roles, hasRole, hasAnyRole, hasAllRoles }` | Role checking utilities             |
| `useFeature(name)`               | `{ enabled, reason }`                         | Check a feature flag with reason    |
| `usePolicy(perm, resource?)`     | `{ allowed, matchedRule, reason }`            | Evaluate policy rules               |
| `useExperiment(id)`              | `{ variant, active, experimentId }`           | Get experiment assignment           |
| `usePlan()`                      | `{ plan, hasPlanAccess }`                     | Subscription plan checks            |
| `useAccessDebug()`               | `AccessDebugInfo`                             | Debug metadata (when `debug: true`) |
| `useAccessDebug()`               | `AccessDebugInfo`                             | Debug metadata (when `debug: true`) |

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

### E-commerce Store

A complete e-commerce example — roles, plans, feature flags, and A/B tests in one config:

```typescript
import { defineAccess, AccessProvider, Allow, useAccess } from 'react-access-engine';

// 1. One config for your entire store
const config = defineAccess({
  roles: ['customer', 'seller', 'admin', 'support'],
  permissions: {
    customer: ['products:browse', 'cart:manage', 'orders:own', 'reviews:write', 'wishlist:manage'],
    seller:   ['products:browse', 'products:create', 'inventory:manage', 'analytics:own-store'],
    admin:    ['*'],
    support:  ['orders:view-all', 'orders:refund', 'reviews:moderate', 'tickets:manage'],
  },
  plans: ['free', 'plus', 'premium'],
  features: {
    'quick-buy':          true,                                           // Buy-now button
    'wishlist':           true,                                           // Wishlist
    'ai-recommendations': { enabled: true, allowedPlans: ['premium'] },   // Premium-only AI
    'live-chat':          { enabled: true, allowedPlans: ['plus', 'premium'] },
    'loyalty-points':     { enabled: true, allowedPlans: ['plus', 'premium'] },
    'bulk-discount':      { enabled: true, allowedRoles: ['seller'] },    // Seller-only
  },
  experiments: {
    'checkout-layout': {
      id: 'checkout-layout',
      variants: ['classic', 'one-page', 'step-wizard'],
      defaultVariant: 'classic',
      active: true,
      allocation: { classic: 34, 'one-page': 33, 'step-wizard': 33 },
    },
  },
});

// 2. Wrap your app
function App() {
  const user = useCurrentUser(); // your auth hook
  return (
    <AccessProvider config={config} user={{ id: user.id, roles: user.roles, plan: user.plan }}>
      <Store />
    </AccessProvider>
  );
}
```

```tsx
// 3. Protect anything — products, checkout, dashboards
function ProductCard({ product }) {
  const { can, has } = useAccess();

  return (
    <div>
      <h3>
        {product.name} — ${product.price}
      </h3>

      <Allow permission="cart:manage">
        <button>🛒 Add to Cart</button>
      </Allow>

      {has('quick-buy') && can('cart:manage') && <button>⚡ Buy Now</button>}

      <Allow feature="wishlist">
        <button>❤️ Wishlist</button>
      </Allow>
    </div>
  );
}

// Premium-only AI recommendations with upgrade prompt
function AIRecommendations() {
  return (
    <Allow feature="ai-recommendations" fallback={<UpgradePrompt plan="premium" />}>
      <div>🤖 AI Picks: Wireless Earbuds, Phone Case, USB-C Cable</div>
    </Allow>
  );
}

// Seller-only dashboard — hidden for customers
function SellerDashboard() {
  return (
    <Allow role="seller">
      <div>
        <h3>📦 Seller Dashboard</h3>
        <Allow permission="inventory:manage">
          <p>✅ Manage inventory</p>
        </Allow>
        <Allow permission="analytics:own-store">
          <p>✅ Store analytics</p>
        </Allow>
        <Allow feature="bulk-discount">
          <p>✅ Bulk discount pricing</p>
        </Allow>
      </div>
    </Allow>
  );
}

// Support tools — only visible to support agents
function SupportTools() {
  return (
    <Allow role="support">
      <div>
        <Allow permission="orders:refund">
          <button>Process Refund</button>
        </Allow>
        <Allow permission="reviews:moderate">
          <button>Moderate Reviews</button>
        </Allow>
      </div>
    </Allow>
  );
}
```

> 📂 Full runnable example: [`examples/ecommerce`](examples/ecommerce) — switch between Customer, Seller, Admin, and Support users to see everything change in real time.

### SaaS Dashboard

```tsx
function SaasDashboard() {
  const { can, tier } = useAccess();

  return (
    <AccessProvider config={saasConfig} user={currentUser}>
      <Sidebar>
        <Allow permission="dashboard:view">
          <NavLink to="/dashboard">Dashboard</NavLink>
        </Allow>
        <Allow permission="analytics:view" feature="analytics-v2">
          <NavLink to="/analytics">Analytics</NavLink>
        </Allow>
        <Allow permission="billing:manage">
          <NavLink to="/billing">Billing</NavLink>
        </Allow>
      </Sidebar>

      <Allow permission="settings:manage" plan="pro" fallback={<UpgradePrompt />}>
        <AdvancedSettings />
      </Allow>
    </AccessProvider>
  );
}
```

### Admin Panel

```tsx
const adminConfig = defineAccess({
  roles: ['super-admin', 'admin', 'moderator', 'support'],
  permissions: {
    'super-admin': ['*'],
    admin: ['users:*', 'content:*', 'settings:read'],
    moderator: ['content:read', 'content:moderate', 'reports:read'],
    support: ['users:read', 'tickets:*'],
  },
});

function AdminPanel() {
  const { can } = useAccess();

  return (
    <Allow permission="users:read" fallback={<div>No admin access</div>}>
      <UserTable />
      {can('users:delete') && <BulkDeleteButton />}
    </Allow>
  );
}
```

### Subscription-Gated App

```tsx
const config = defineAccess({
  roles: ['user'],
  permissions: { user: ['app:access'] },
  plans: ['free', 'pro', 'enterprise'],
  features: {
    'export-csv': { enabled: true, allowedPlans: ['pro', 'enterprise'] },
    'api-access': { enabled: true, allowedPlans: ['enterprise'] },
  },
});

function ExportButton() {
  return (
    <Allow feature="export-csv" fallback={<UpgradeBanner plan="pro" />}>
      <button>Export CSV</button>
    </Allow>
  );
}
```

## SSR / Next.js

react-access-engine is SSR-safe by design:

- All hooks return deterministic values (no `useEffect` for initial state)
- No `window`/`document`/`localStorage` access in core evaluation
- Rollouts use user ID hashing, not `Math.random()`
- All components use `'use client'` directive for App Router compatibility

```tsx
// app/layout.tsx (Next.js App Router)
import { AccessProvider } from 'react-access-engine';

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

`defineAccess` works without `as const`. Add it when you want literal-type inference:

```typescript
const config = defineAccess({
  roles: ['admin', 'editor'] as const,
  permissions: {
    admin: ['users:manage', 'billing:read'] as const,
    editor: ['articles:write'] as const,
  },
});

// InferRoles<typeof config> = 'admin' | 'editor'
// InferPermissions<typeof config> = 'users:manage' | 'billing:read' | 'articles:write'
```

Without `as const`, everything still works — you just get `string` instead of literal union types.

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
│   ├── react-access-engine/  # Core library (published to npm)
│   ├── devtools/              # Dev overlay for inspecting access decisions
│   └── shared/                # Internal shared utilities
├── apps/
│   ├── docs/                  # Next.js documentation site
│   └── playground/            # Interactive playground
├── examples/
│   ├── basic/                 # Simple RBAC example
│   ├── ecommerce/             # E-commerce store (roles, plans, flags, A/B)
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

| Feature              | react-access-engine | RBAC Library | Feature Flag Service | DIY |
| -------------------- | :-----------------: | :----------: | :------------------: | :-: |
| RBAC with wildcards  |         ✅          |      ✅      |          ❌          | ⚠️  |
| ABAC / Policy engine |         ✅          |      ❌      |          ❌          | ⚠️  |
| Feature flags        |         ✅          |      ❌      |          ✅          | ❌  |
| A/B Experiments      |         ✅          |      ❌      |          ⚠️          | ❌  |
| Plan gating          |         ✅          |      ❌      |          ❌          | ⚠️  |
| Remote config        |         ✅          |      ❌      |          ✅          | ❌  |
| Plugin system        |         ✅          |      ❌      |          ❌          | ❌  |
| DevTools overlay     |         ✅          |      ❌      |          ⚠️          | ❌  |
| SSR-safe (Next.js)   |         ✅          |      ⚠️      |          ⚠️          | ⚠️  |
| Tree-shakeable       |         ✅          |      ✅      |          ❌          | ✅  |
| Zero dependencies    |         ✅          |      ✅      |          ❌          | ✅  |
| Type-safe inference  |         ✅          |      ❌      |          ❌          | ⚠️  |

## Community

- [Documentation](https://react-access-engine.dev)
- [GitHub Discussions](https://github.com/abhishekayu/react-access-engine/discussions) — Questions & ideas
- [Issue Tracker](https://github.com/abhishekayu/react-access-engine/issues) — Bug reports & feature requests
- [Changelog](https://github.com/abhishekayu/react-access-engine/blob/main/packages/react-access-engine/CHANGELOG.md)

## Sponsors

If react-access-engine saves you time, consider [sponsoring the project](https://github.com/sponsors/abhishekayu).

## License

[MIT](LICENSE) © [Abhishek](https://github.com/abhishekayu)
