<div align="center">
  
<img width="400" height="400" alt="React Access Engine — unified RBAC, ABAC, feature flags, and policy engine for React and Node.js" src="https://github.com/user-attachments/assets/6593ecec-b349-44f6-96d5-a3ff599dcd6b" />
  
# React Access Engine

**Unified access control, RBAC, ABAC, feature flags, experiments, and policy engine for React.js, Next.js & Node.js.**

One config. Frontend hooks + backend engine functions. Same logic everywhere.

React.js, Next.js, Node.js, Express, RBAC, ABAC, authorization, permissions, feature flags, A/B testing, plan gating, remote config, SSR-safe, TypeScript, middleware, subscription

[![npm version](https://img.shields.io/npm/v/react-access-engine?color=blue&label=npm)](https://www.npmjs.com/package/react-access-engine)
[![minzipped size](https://img.shields.io/badge/minzipped-5.7_kB-blue)](https://bundlephobia.com/package/react-access-engine)
[![tests](https://img.shields.io/badge/tests-620%20passing-brightgreen)](https://github.com/abhishekayu/react-access-engine)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[Documentation](https://react-access-engine.dev/docs) · [Playground](https://react-access-engine.dev/playground) · [Examples](https://github.com/abhishekayu/react-access-engine/tree/main/examples)

</div>

---

## Table of Contents

- [Why?](#why)
- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
  - [useAccess() Hook](#useaccess--the-only-hook-you-need)
  - [Allow Component](#allow--the-only-component-you-need)
  - [Specialized Components](#specialized-components)
  - [Specialized Hooks](#specialized-hooks)
- [Advanced Usage](#advanced-usage)
  - [Policy Engine (ABAC)](#policy-engine-abac)
  - [Percentage Rollouts](#percentage-rollouts)
  - [Feature Dependencies](#feature-dependencies)
  - [Plan Gating](#subscriptionplan-gating)
  - [Plugin System](#plugin-system)
  - [Experiments / A/B Testing](#experiments--ab-testing)
  - [Debug Mode](#debug-mode)
  - [Remote Config](#remote-config)
  - [Condition Engine](#condition-engine-declarative-abac)
- [Full E-commerce Example](#full-e-commerce-example)
- [SSR / Next.js](#ssr--nextjs)
- [TypeScript](#typescript)
- [Backend / Node.js Usage](#backend--nodejs-usage)
- [Architecture](#architecture)
- [Testing](#testing)
- [Comparison](#comparison)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

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

- **RBAC** — Multi-role users, role → permission mapping, wildcard permissions (`*`, `namespace:*`)
- **ABAC** — Attribute-based policies with composable allow/deny rules and priority ordering
- **Feature Flags** — Boolean toggles, percentage rollouts, role/plan/environment targeting, dependencies
- **A/B Experiments** — Deterministic variant assignment, SSR-safe hashing, allocation control
- **Plan Gating** — Hierarchical subscription tiers with automatic comparison
- **Remote Config** — Fetch config from API with stale-while-revalidate, polling, signature verification
- **Plugin System** — Lifecycle hooks for audit logging, analytics, custom condition operators
- **DevTools** — Optional overlay for inspecting access decisions and policy traces
- **Type Safety** — Full TypeScript inference — `InferRoles`, `InferPermissions`, `InferFeatures`
- **SSR-Ready** — Deterministic evaluation, works with Next.js App Router
- **Tree-Shakeable** — Import only what you use — unused engines are eliminated at build time
- **Zero Dependencies** — No runtime dependencies beyond React

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
  roles: ['customer', 'seller', 'admin', 'support'],
  permissions: {
    customer: ['products:browse', 'cart:manage', 'orders:own', 'reviews:write', 'wishlist:manage'],
    seller: [
      'products:browse',
      'products:create',
      'products:edit-own',
      'inventory:manage',
      'analytics:own-store',
      'coupons:create',
    ],
    admin: ['*'],
    support: ['orders:view-all', 'orders:refund', 'reviews:moderate', 'tickets:manage'],
  },
  plans: ['free', 'plus', 'premium'],
  features: {
    'quick-buy': true,
    wishlist: true,
    'ai-recommendations': { enabled: true, allowedPlans: ['premium'] },
    'live-chat': { enabled: true, allowedPlans: ['plus', 'premium'] },
    'loyalty-points': { enabled: true, allowedPlans: ['plus', 'premium'] },
    'bulk-discount': { enabled: true, allowedRoles: ['seller'] },
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
  policies: [
    {
      id: 'seller-own-products',
      effect: 'allow',
      permissions: ['products:edit', 'products:delete'],
      condition: ({ user, resource }) => user.id === resource.sellerId,
      description: 'Sellers can only edit/delete their own products',
    },
    {
      id: 'refund-time-limit',
      effect: 'deny',
      permissions: ['orders:refund'],
      condition: ({ resource }) => {
        const daysSinceOrder = (Date.now() - resource.orderedAt) / 86400000;
        return daysSinceOrder > 30;
      },
      priority: 100,
      description: 'Block refunds after 30 days',
    },
  ],
  plugins: [
    {
      name: 'store-analytics',
      onAccessCheck: (event) => {
        console.log(`[STORE] ${event.permission}: ${event.granted ? '✅' : '❌'}`);
      },
      onFeatureEvaluate: (event) => {
        console.log(`[FLAG] ${event.feature}: ${event.enabled ? 'ON' : 'OFF'}`);
      },
    },
  ],
  debug: true,
});
```

### 2. Wrap your app

```tsx
import { AccessProvider } from 'react-access-engine';

function App() {
  const user = useCurrentUser(); // your auth hook
  return (
    <AccessProvider config={config} user={{ id: user.id, roles: user.roles, plan: user.plan }}>
      <Store />
    </AccessProvider>
  );
}
```

### 3. Use it

```tsx
import { useAccess } from 'react-access-engine';

function StorePage() {
  const { can, is, has, tier } = useAccess();

  return (
    <div>
      {can('cart:manage') && <button>🛒 Add to Cart</button>}
      {is('seller') && <SellerDashboard />}
      {has('quick-buy') && <button>⚡ Buy Now</button>}
      {tier('premium') && <AIRecommendations />}
    </div>
  );
}
```

**Or use `<Allow>` — one component for all access control:**

```tsx
import { Allow } from 'react-access-engine';

function StorePage() {
  return (
    <div>
      <Allow permission="cart:manage">
        <button>🛒 Add to Cart</button>
      </Allow>

      <Allow role="seller">
        <SellerDashboard />
      </Allow>

      <Allow feature="ai-recommendations" fallback={<UpgradePrompt plan="premium" />}>
        <AIRecommendations />
      </Allow>

      <Allow plan="plus" fallback={<UpgradePrompt />}>
        <LiveChat />
      </Allow>

      {/* Combine conditions — all must pass */}
      <Allow permission="analytics:own-store" role="seller" plan="plus">
        <StoreAnalytics />
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
<Can perform="products:edit" on={{ sellerId: product.sellerId }} fallback={<ReadOnly />}>
  <ProductEditor />
</Can>
```

#### `<Feature>`

Feature flag gate.

```tsx
<Feature name="live-chat" fallback={<EmailSupport />}>
  <LiveChat />
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
| `useRemoteConfig(base, loader)`  | `{ config, loading, error, stale, refresh }`  | Remote config with SWR pattern      |

## Advanced Usage

### Policy Engine (ABAC)

Define composable allow/deny rules for fine-grained access control:

```typescript
const config = defineAccess({
  roles: ['customer', 'seller', 'admin', 'support'],
  permissions: {
    customer: ['products:browse', 'cart:manage', 'orders:own', 'reviews:write'],
    seller: ['products:browse', 'products:create', 'inventory:manage'],
    admin: ['*'],
    support: ['orders:view-all', 'orders:refund', 'reviews:moderate'],
  },
  policies: [
    {
      id: 'seller-own-products',
      effect: 'allow',
      permissions: ['products:edit', 'products:delete'],
      condition: ({ user, resource }) => user.id === resource.sellerId,
      description: 'Sellers can only edit/delete their own products',
    },
    {
      id: 'refund-time-limit',
      effect: 'deny',
      permissions: ['orders:refund'],
      condition: ({ resource }) => {
        const daysSinceOrder = (Date.now() - resource.orderedAt) / 86400000;
        return daysSinceOrder > 30;
      },
      priority: 100,
      description: 'Block refunds after 30 days',
    },
  ],
});
```

Use policies in components with the `on` prop:

```tsx
// Seller can only edit their own products
<Can perform="products:edit" on={{ sellerId: product.sellerId }}>
  <button>Edit Product</button>
</Can>

// Support can only refund recent orders
<Can perform="orders:refund" on={{ orderedAt: order.createdAt }}>
  <button>Process Refund</button>
</Can>
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

Hook into every access decision for logging, analytics, or custom behavior:

```typescript
import {
  createAuditLoggerPlugin,
  createAnalyticsPlugin,
  createOperatorPlugin,
} from 'react-access-engine';

// Built-in plugins — drop-in audit logging and analytics
const auditPlugin = createAuditLoggerPlugin({
  logger: (entry) => fetch('/api/audit', { method: 'POST', body: JSON.stringify(entry) }),
});

// Custom condition operators for the ABAC condition engine
const operatorPlugin = createOperatorPlugin([
  { name: 'regex', evaluate: (value, pattern) => new RegExp(pattern).test(String(value)) },
  { name: 'lengthGt', evaluate: (value, min) => String(value).length > Number(min) },
]);

// Custom plugin — e-commerce analytics
const storePlugin = {
  name: 'store-analytics',
  onAccessCheck: (event) => {
    // Track when customers are blocked from actions (e.g. upgrade prompt triggers)
    if (!event.granted) {
      analytics.track('access_denied', { permission: event.permission, userId: event.userId });
    }
  },
  onFeatureEvaluate: (event) => {
    // Track feature flag exposure for product analytics
    analytics.track('feature_exposure', { feature: event.feature, enabled: event.enabled });
  },
  onExperimentAssign: (event) => {
    // Track A/B test variant assignments
    analytics.track('experiment_assigned', {
      experiment: event.experimentId,
      variant: event.variant,
    });
  },
};

const config = defineAccess({
  // ...roles, permissions, features, experiments, policies...
  plugins: [auditPlugin, storePlugin],
});
```

Plugins fire on every `can()`, `has()`, and `useExperiment()` call — zero component changes needed.

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

### Remote Config

Fetch access configuration from an API with stale-while-revalidate, polling, and optional signature verification:

```tsx
import { useRemoteConfig, AccessProvider, defineAccess } from 'react-access-engine';

const baseConfig = defineAccess({
  roles: ['viewer', 'editor', 'admin'],
  permissions: { viewer: ['read'], editor: ['read', 'write'], admin: ['*'] },
});

function App() {
  const { config, loading, error, stale, refresh } = useRemoteConfig(baseConfig, {
    load: () => fetch('/api/access-config').then((r) => r.json()),
    pollInterval: 60_000, // Re-fetch every 60s
    signatureHeader: 'x-config-signature',
    verifySignature: (payload, sig) => verify(payload, sig),
  });

  if (loading) return <Spinner />;

  return (
    <AccessProvider config={config} user={user}>
      <YourApp />
    </AccessProvider>
  );
}
```

For advanced use, the `RemoteConfigEngine` class is also exported for direct programmatic control.

### Merging Configs

Use `mergeConfigs` to combine a base config with overrides (e.g., remote patches, environment-specific tweaks):

```typescript
import { defineAccess, mergeConfigs } from 'react-access-engine';

const base = defineAccess({
  roles: ['viewer', 'admin'],
  permissions: { viewer: ['read'], admin: ['*'] },
});
const overrides = { features: { 'new-ui': true } };

const merged = mergeConfigs(base, overrides);
// merged has all base config + new-ui feature added
```

### Condition Engine (Declarative ABAC)

For declarative attribute-based conditions without writing callback functions, use the condition engine:

```typescript
import { evaluateConditions, buildConditionContext } from 'react-access-engine';

const conditions = [
  { field: 'user.role', operator: 'in' as const, value: ['admin', 'manager'] },
  { field: 'resource.status', operator: 'equals' as const, value: 'draft' },
];

const context = buildConditionContext(
  { role: 'admin', id: 'u1' },
  { status: 'draft', ownerId: 'u1' },
);

const allowed = evaluateConditions(conditions, context); // true
```

Built-in operators: `equals`, `notEquals`, `in`, `notIn`, `includes`, `greaterThan`, `lessThan`, `greaterThanOrEqual`, `lessThanOrEqual`, `exists`.

Add custom operators via the `createOperatorPlugin` plugin factory (see Plugin System above).

## Full E-commerce Example

A complete e-commerce store using **every feature** — RBAC, ABAC policies, feature flags, A/B experiments, plan gating, plugins, and devtools.

### Config — One Source of Truth

```typescript
import { defineAccess } from 'react-access-engine';

const storeConfig = defineAccess({
  // ── Roles & Permissions ──────────────────────────────────────────────
  roles: ['customer', 'seller', 'admin', 'support'],
  permissions: {
    customer: ['products:browse', 'cart:manage', 'orders:own', 'reviews:write', 'wishlist:manage'],
    seller: [
      'products:browse',
      'products:create',
      'products:edit-own',
      'inventory:manage',
      'analytics:own-store',
      'orders:seller-view',
      'coupons:create',
    ],
    admin: ['*'],
    support: ['orders:view-all', 'orders:refund', 'reviews:moderate', 'tickets:manage'],
  },

  // ── Plans ────────────────────────────────────────────────────────────
  plans: ['free', 'plus', 'premium'],

  // ── Feature Flags ───────────────────────────────────────────────────
  features: {
    'quick-buy': true, // Simple toggle
    wishlist: true,
    'reviews-v2': { rolloutPercentage: 50 }, // 50% rollout
    'ai-recommendations': { enabled: true, allowedPlans: ['premium'] }, // Plan-gated
    'live-chat': { enabled: true, allowedPlans: ['plus', 'premium'] },
    'loyalty-points': { enabled: true, allowedPlans: ['plus', 'premium'] },
    'bulk-discount': { enabled: true, allowedRoles: ['seller'] }, // Role-gated
  },

  // ── A/B Experiments ─────────────────────────────────────────────────
  experiments: {
    'checkout-layout': {
      id: 'checkout-layout',
      variants: ['classic', 'one-page', 'step-wizard'],
      defaultVariant: 'classic',
      active: true,
      allocation: { classic: 34, 'one-page': 33, 'step-wizard': 33 },
    },
    'promo-banner': {
      id: 'promo-banner',
      variants: ['seasonal', 'loyalty', 'referral'],
      defaultVariant: 'seasonal',
      active: true,
      allocation: { seasonal: 34, loyalty: 33, referral: 33 },
    },
  },

  // ── ABAC Policies ───────────────────────────────────────────────────
  policies: [
    {
      id: 'seller-own-products',
      effect: 'allow',
      permissions: ['products:edit', 'products:delete'],
      condition: ({ user, resource }) => user.id === resource.sellerId,
      description: 'Sellers can only edit/delete their own products',
    },
    {
      id: 'refund-time-limit',
      effect: 'deny',
      permissions: ['orders:refund'],
      condition: ({ resource }) => {
        const daysSinceOrder = (Date.now() - resource.orderedAt) / 86400000;
        return daysSinceOrder > 30;
      },
      priority: 100,
      description: 'Block refunds after 30 days',
    },
    {
      id: 'premium-bulk-orders',
      effect: 'allow',
      permissions: ['orders:bulk-create'],
      condition: ({ user }) => user.plan === 'premium',
      description: 'Only premium users can place bulk orders',
    },
  ],

  // ── Plugins ─────────────────────────────────────────────────────────
  plugins: [
    {
      name: 'store-audit',
      onAccessCheck: (event) => {
        // Log every access decision for compliance
        console.log(`[AUDIT] ${event.permission}: ${event.granted ? '✅' : '❌'}`);
      },
      onFeatureEvaluate: (event) => {
        // Track feature flag exposure
        analytics.track('feature_exposure', { feature: event.feature, enabled: event.enabled });
      },
      onExperimentAssign: (event) => {
        // Track A/B test assignments
        analytics.track('experiment_assigned', { id: event.experimentId, variant: event.variant });
      },
    },
  ],

  debug: true, // Enable DevTools overlay
});
```

### Components — Protect Everything

```tsx
import {
  AccessProvider,
  Allow,
  Can,
  Feature,
  Experiment,
  useAccess,
  useExperiment,
} from 'react-access-engine';
import { AccessDevtools } from 'react-access-engine-devtools';

// ── Product Card ───────────────────────────────────────────────────────
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

// ── ABAC: Seller can only edit own products ────────────────────────────
function ProductActions({ product }) {
  return (
    <Can perform="products:edit" on={{ sellerId: product.sellerId }}>
      <button>✏️ Edit</button>
    </Can>
  );
}

// ── ABAC: Refund blocked after 30 days ─────────────────────────────────
function RefundButton({ order }) {
  return (
    <Can
      perform="orders:refund"
      on={{ orderedAt: order.createdAt }}
      fallback={<span>Refund window expired</span>}
    >
      <button>💸 Process Refund</button>
    </Can>
  );
}

// ── Plan-gated feature with upgrade prompt ─────────────────────────────
function AIRecommendations() {
  return (
    <Allow feature="ai-recommendations" fallback={<UpgradePrompt plan="premium" />}>
      <div>🤖 AI Picks: Earbuds, Phone Case, USB-C Cable</div>
    </Allow>
  );
}

// ── A/B Test: Declarative variant rendering ────────────────────────────
function PromoBanner() {
  return (
    <Experiment
      id="promo-banner"
      variants={{
        seasonal: <div>🎄 Winter Sale — 50% off!</div>,
        loyalty: <div>⭐ Double Points Week!</div>,
        referral: <div>👥 Refer & Save — Give $10, Get $10</div>,
      }}
      fallback={<div>Loading promotion...</div>}
    />
  );
}

// ── A/B Test: Hook-based variant ───────────────────────────────────────
function CheckoutSection() {
  const { variant } = useExperiment('checkout-layout');
  return (
    <div>
      {variant === 'classic' && <ClassicCheckout />}
      {variant === 'one-page' && <OnePageCheckout />}
      {variant === 'step-wizard' && <WizardCheckout />}
    </div>
  );
}

// ── Seller Dashboard ───────────────────────────────────────────────────
function SellerDashboard() {
  return (
    <Allow role="seller">
      <h3>📦 Seller Dashboard</h3>
      <Can perform="inventory:manage">
        <p>Inventory Manager</p>
      </Can>
      <Can perform="analytics:own-store">
        <p>Store Analytics</p>
      </Can>
      <Can perform="coupons:create">
        <p>Create Coupons</p>
      </Can>
      <Feature name="bulk-discount">
        <p>Bulk Discount Pricing</p>
      </Feature>
    </Allow>
  );
}

// ── Support Tools ──────────────────────────────────────────────────────
function SupportTools() {
  return (
    <Allow role="support">
      <Can perform="orders:view-all">
        <p>View All Orders</p>
      </Can>
      <Can perform="orders:refund">
        <button>Process Refund</button>
      </Can>
      <Can perform="reviews:moderate">
        <button>Moderate Reviews</button>
      </Can>
      <Can perform="tickets:manage">
        <button>Manage Tickets</button>
      </Can>
    </Allow>
  );
}

// ── App — Everything together ──────────────────────────────────────────
function App() {
  const user = useCurrentUser();
  return (
    <AccessProvider config={storeConfig} user={{ id: user.id, roles: user.roles, plan: user.plan }}>
      <ProductCard product={product} />
      <ProductActions product={product} />
      <AIRecommendations />
      <PromoBanner />
      <CheckoutSection />
      <SellerDashboard />
      <SupportTools />
      <AccessDevtools position="bottom-right" />
    </AccessProvider>
  );
}
```

> 📂 Full runnable example: [`examples/ecommerce`](examples/ecommerce) — switch between Customer, Seller, Admin, and Support users to see everything change in real time.

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
  roles: ['customer', 'seller', 'admin'] as const,
  permissions: {
    customer: ['products:browse', 'cart:manage'] as const,
    seller: ['products:create', 'inventory:manage'] as const,
    admin: ['*'] as const,
  },
});

// InferRoles<typeof config> = 'customer' | 'seller' | 'admin'
// InferPermissions<typeof config> = 'products:browse' | 'cart:manage' | 'products:create' | 'inventory:manage' | '*'
```

Without `as const`, everything still works — you just get `string` instead of literal union types.

## Backend / Node.js Usage

The same `react-access-engine` package works on the backend. All engine functions are **pure logic** — no React dependency — so you can import them directly in Node.js, Express, Fastify, Deno, or any JavaScript runtime.

```bash
npm install react-access-engine
```

### Shared Config Pattern

Define your access config **once** and share it between frontend and backend:

```typescript
// shared/access-config.ts — single source of truth
import { defineAccess } from 'react-access-engine';

export const accessConfig = defineAccess({
  roles: ['viewer', 'editor', 'admin', 'super_admin'] as const,
  permissions: {
    viewer: ['articles:read', 'comments:read', 'dashboard:view'],
    editor: ['articles:read', 'articles:write', 'articles:publish', 'comments:*', 'media:upload'],
    admin: ['articles:*', 'comments:*', 'media:*', 'users:*', 'settings:*', 'analytics:*'],
    super_admin: ['*'],
  },
  plans: ['free', 'starter', 'professional', 'enterprise'] as const,
  features: {
    dark_mode: true,
    ai_assistant: { enabled: true, allowedRoles: ['admin', 'super_admin'] },
    api_access: { enabled: true, allowedPlans: ['professional', 'enterprise'] },
    beta_features: { enabled: true, allowedEnvironments: ['development', 'staging'] },
  },
  experiments: {
    checkout_flow: {
      id: 'checkout_flow',
      variants: ['control', 'single_page', 'multi_step'] as const,
      defaultVariant: 'control',
      active: true,
      allocation: { control: 34, single_page: 33, multi_step: 33 },
    },
  },
  policies: [
    {
      id: 'owner-can-edit',
      effect: 'allow',
      permissions: ['articles:write'],
      priority: 100,
      condition: ({ user, resource }) => resource?.authorId === user.id,
    },
    {
      id: 'deny-delete-published',
      effect: 'deny',
      permissions: ['articles:delete'],
      priority: 90,
      condition: ({ resource }) => resource?.status === 'published',
    },
  ],
  environment: { name: 'production' },
});

export type AppRoles = (typeof accessConfig.roles)[number];
```

### Express API Example

Import engine functions and use them in your route handlers — no middleware package needed:

```typescript
// server.ts
import express from 'express';
import {
  hasPermission,
  hasRole,
  evaluateFeature,
  evaluatePolicy,
  assignExperiment,
  hasPlanAccess,
  getPlanTier,
  getPermissionsForUser,
  evaluateAllFeatures,
} from 'react-access-engine';
import type { UserContext } from 'react-access-engine';
import { accessConfig } from './shared/access-config';

const app = express();
app.use(express.json());

// Your auth middleware sets req.user
app.use(async (req: any, _res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  req.user = await getUserFromToken(token); // { id, roles, plan, attributes }
  next();
});
```

### Permission Guards (Middleware)

```typescript
// Reusable permission guard
function requirePermission(...permissions: string[]) {
  return (req: any, res: express.Response, next: express.NextFunction) => {
    const user: UserContext = req.user;
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    for (const perm of permissions) {
      if (!hasPermission(user, perm, accessConfig)) {
        return res.status(403).json({ error: `Permission denied: ${perm}` });
      }
    }
    next();
  };
}

// Usage
app.get('/api/articles', requirePermission('articles:read'), (req: any, res) => {
  res.json({ articles: getAllArticles() });
});

app.post('/api/articles', requirePermission('articles:write'), (req: any, res) => {
  res.status(201).json({ article: createArticle(req.body, req.user) });
});

app.delete('/api/articles/:id', requirePermission('articles:delete'), (req: any, res) => {
  // Additional ABAC policy check
  const article = getArticleById(req.params.id);
  const policy = evaluatePolicy('articles:delete', req.user, accessConfig, { resource: article });

  if (policy.effect === 'deny') {
    return res.status(403).json({
      error: 'Policy denied',
      rule: policy.matchedRule,
      reason: policy.reason,
    });
  }

  deleteArticle(req.params.id);
  res.json({ message: 'Deleted' });
});
```

### Feature-Gated Endpoints

```typescript
app.get('/api/ai/suggest', (req: any, res) => {
  const user: UserContext = req.user;
  const feature = evaluateFeature('ai_assistant', user, accessConfig, accessConfig.environment);

  if (!feature.enabled) {
    return res.status(403).json({
      error: 'AI Assistant not available for your account',
      reason: feature.reason, // 'role', 'plan', 'rollout', etc.
    });
  }

  res.json({ suggestions: generateAISuggestions(req.body) });
});

// Get all feature flags for current user (useful for frontend hydration)
app.get('/api/features', (req: any, res) => {
  const allFeatures = evaluateAllFeatures(req.user, accessConfig, accessConfig.environment);
  res.json({
    features: Array.from(allFeatures.entries()).map(([name, result]) => ({
      name,
      enabled: result.enabled,
      reason: result.reason,
    })),
  });
});
```

### Plan-Gated Endpoints

```typescript
app.get('/api/integrations', (req: any, res) => {
  const user: UserContext = req.user;

  if (!hasPlanAccess(user, 'professional', accessConfig)) {
    return res.status(403).json({
      error: 'Integrations require Professional plan or higher',
      currentPlan: user.plan,
      currentTier: getPlanTier(user, accessConfig),
    });
  }

  res.json({ integrations: getAvailableIntegrations() });
});
```

### ABAC Policy Evaluation in API

```typescript
app.post('/api/check/policy', (req: any, res) => {
  const { permission, resource } = req.body;

  const result = evaluatePolicy(permission, req.user, accessConfig, {
    resource,
    environment: accessConfig.environment,
  });

  res.json({
    permission,
    effect: result.effect, // 'allow' or 'deny'
    matchedRule: result.matchedRule, // e.g. 'owner-can-edit'
    reason: result.reason,
  });
});
```

### A/B Experiments on Backend

```typescript
app.get('/api/experiment/:id', (req: any, res) => {
  const experiment = accessConfig.experiments?.[req.params.id];
  if (!experiment) return res.status(404).json({ error: 'Experiment not found' });

  const assignment = assignExperiment(experiment, req.user);
  // assignment = { experimentId, variant, active }

  res.json(assignment);
});

// Use experiments to vary API behavior
app.get('/api/recommendations', (req: any, res) => {
  const { variant } = assignExperiment(accessConfig.experiments.checkout_flow, req.user);

  if (variant === 'single_page') {
    return res.json({ layout: 'single', items: getCompactRecommendations() });
  }
  res.json({ layout: 'default', items: getFullRecommendations() });
});
```

### Full User Access Snapshot

```typescript
// Return everything a frontend needs in one call
app.get('/api/me/access', (req: any, res) => {
  const user: UserContext = req.user;

  res.json({
    user: { id: user.id, roles: user.roles, plan: user.plan },
    permissions: [...getPermissionsForUser(user, accessConfig)],
    planTier: getPlanTier(user, accessConfig),
    features: Array.from(evaluateAllFeatures(user, accessConfig).entries()).map(
      ([name, result]) => ({ name, ...result }),
    ),
    experiments: Object.values(accessConfig.experiments ?? {}).map((exp) =>
      assignExperiment(exp, user),
    ),
  });
});
```

### Using Plugins on the Backend

Plugins work identically on Node.js:

```typescript
import {
  PluginEngine,
  DebugEngine,
  createAuditLoggerPlugin,
  createAnalyticsPlugin,
} from 'react-access-engine';

// Initialize plugin engine
const pluginEngine = new PluginEngine();
pluginEngine.registerAll([
  createAuditLoggerPlugin({
    log: (entry) => auditService.write(entry),
    deniedOnly: true,
  }),
  createAnalyticsPlugin({
    adapter: { track: (name, props) => mixpanel.track(name, props) },
  }),
]);

// Emit events from your route handlers
app.get('/api/articles', (req: any, res) => {
  const granted = hasPermission(req.user, 'articles:read', config);
  pluginEngine.emitAccessCheck({
    permission: 'articles:read',
    granted,
    roles: [...req.user.roles],
    timestamp: Date.now(),
  });
  // ...
});

// Debug engine for audit trails
const debugEngine = new DebugEngine();
debugEngine.setConfig(config);
debugEngine.recordAccessCheck({
  permission: 'articles:read',
  granted: true,
  roles: ['admin'],
  timestamp: Date.now(),
});
console.log(debugEngine.getDebugInfo()); // { lastChecks, lastFeatureEvals, lastPolicyEvals, configSnapshot, timestamp }
```

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      AccessProvider                          │
│                                                              │
│  ┌───────────┐ ┌────────────┐ ┌───────────────┐             │
│  │ Role      │ │ Permission │ │ Policy Engine │             │
│  │ Engine    │ │ Engine     │ │ (ABAC rules)  │             │
│  └───────────┘ └────────────┘ └───────────────┘             │
│                                                              │
│  ┌───────────┐ ┌────────────┐ ┌───────────────┐             │
│  │ Feature   │ │ Experiment │ │ Plan Engine   │             │
│  │ Engine    │ │ Engine     │ │               │             │
│  └───────────┘ └────────────┘ └───────────────┘             │
│                                                              │
│  ┌───────────┐ ┌────────────┐ ┌───────────────────────────┐ │
│  │ Plugin    │ │ Debug      │ │ Condition Engine          │ │
│  │ Engine    │ │ Engine     │ │ (declarative ABAC)        │ │
│  └───────────┘ └────────────┘ └───────────────────────────┘ │
│                                                              │
│  ┌───────────────────────────┐                               │
│  │ Remote Config Engine      │                               │
│  │ (SWR + polling)           │                               │
│  └───────────────────────────┘                               │
└──────────────────────────────────────────────────────────────┘
```

Each engine is a pure function module. Unused engines are tree-shaken from bundles.

All engine functions exported for **backend / Node.js** use (no React dependency):

- **Roles** — `hasRole`, `hasAnyRole`, `hasAllRoles`
- **Permissions** — `hasPermission`, `hasAnyPermission`, `hasAllPermissions`, `getPermissionsForUser`
- **Features** — `evaluateFeature`, `evaluateAllFeatures`
- **Policies** — `evaluatePolicy`
- **Experiments** — `assignExperiment`
- **Plans** — `hasPlanAccess`, `getPlanTier`
- **Conditions** — `evaluateCondition`, `evaluateConditions`, `buildConditionContext`
- **Classes** — `PluginEngine`, `DebugEngine`

## Testing

**620 tests passing** across 18 test files covering every engine, hook, and component.

```bash
pnpm test
```

- **Engines (344)** — Role (33), Permission (43), Feature (54), Plan (27), Policy (44), Experiment (29), Condition (41), Plugin (25), Debug (14), Remote Config (56)
- **React (181)** — Hooks (74), Components (107)
- **Integration & Utils (95)** — Integration (12), Utilities (13), Plugin Integration (17), plus additional edge-case coverage

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

### Quality & Release Readiness

See [QUALITY.md](QUALITY.md) for test coverage details, rerender strategy, bundle size analysis, SSR safety, and the full QA checklist.

## Comparison

**vs. RBAC libraries** — adds ABAC policies, feature flags, A/B experiments, plan gating, remote config, plugins, and DevTools. Most RBAC libs only cover roles and permissions.

**vs. Feature flag services** (LaunchDarkly, Unleash) — adds RBAC, ABAC, plan gating, and experiments in one zero-dependency package. No vendor lock-in, no external service, fully self-hosted.

**vs. DIY** — type-safe, tested (620 tests), tree-shakeable, SSR-safe, with plugin system and DevTools. Replaces months of custom code with one `npm install`.

## Community

- [Documentation](https://react-access-engine.dev/docs)
- [Playground](https://react-access-engine.dev/playground) — Try it live
- [GitHub Discussions](https://github.com/abhishekayu/react-access-engine/discussions) — Questions & ideas
- [Issue Tracker](https://github.com/abhishekayu/react-access-engine/issues) — Bug reports & feature requests
- [Changelog](CHANGELOG.md)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Security

To report a vulnerability, please see [SECURITY.md](SECURITY.md).

## Sponsors

If react-access-engine saves you time, consider [sponsoring the project](https://github.com/sponsors/abhishekayu).

## License

[MIT](LICENSE) © [Abhishek Verma](https://github.com/abhishekayu)
