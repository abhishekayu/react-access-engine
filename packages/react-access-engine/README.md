<div align="center">

# react-access-engine

**Unified access control for React.js/Next.js — RBAC, ABAC, feature flags, experiments, plan gating, and policy engine.**

One hook. One component. Everything you need.

Also works on Node.js/Express — same config, same logic, no extra package.

React.js, Next.js, Node.js, Express, RBAC, ABAC, authorization, permissions, feature flags, A/B testing, plan gating, remote config, SSR-safe, TypeScript

[![npm version](https://img.shields.io/npm/v/react-access-engine?color=blue&label=npm)](https://www.npmjs.com/package/react-access-engine)
[![minzipped size](https://img.shields.io/badge/minzipped-5.7_kB-blue)](https://bundlephobia.com/package/react-access-engine)
[![CI](https://github.com/abhishekayu/react-access-engine/actions/workflows/ci.yml/badge.svg)](https://github.com/abhishekayu/react-access-engine/actions/workflows/ci.yml)
[![codecov](https://img.shields.io/badge/tests-620%20passing-brightgreen)](https://github.com/abhishekayu/react-access-engine)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

[Documentation](https://react-access-engine.dev/docs) · [Playground](https://react-access-engine.dev/playground) · [GitHub](https://github.com/abhishekayu/react-access-engine)

</div>

---

## Why?

React apps cobble together homegrown RBAC, a feature flag service, ad-hoc plan gating, and manual A/B test wiring each with its own provider, API, and blind spots.

**react-access-engine** replaces all of them with one system:

```tsx
const { can, is, has, tier } = useAccess();

can('edit'); // check permission
is('admin'); // check role
has('dark-mode'); // check feature flag
tier('pro'); // check plan
```

## Features

- **RBAC** — Multi-role users, role → permission mapping, wildcard permissions
- **ABAC** — Attribute-based policies with allow/deny rules and custom condition operators
- **Feature Flags** — Boolean toggles, percentage rollouts, role/plan/environment targeting
- **A/B Experiments** — Deterministic variant assignment, SSR-safe hashing
- **Plan Gating** — Hierarchical subscription tiers with automatic comparison
- **Remote Config** — Fetch config from API with stale-while-revalidate, polling, signature verification
- **Condition Engine** — Declarative ABAC with built-in operators (equals, in, greaterThan, etc.)
- **Plugin System** — Lifecycle hooks for audit logging, analytics, custom operators
- **DevTools** — Optional overlay for inspecting access decisions in real time
- **Type Safety** — Full TypeScript inference — `InferRoles`, `InferPermissions`, `InferFeatures`
- **SSR-Ready** — Deterministic evaluation, works with Next.js App Router
- **Tree-Shakeable** — Import only what you use — unused engines are eliminated at build time
- **Backend Support** — Same engine functions work in Node.js/Express — no separate package needed
- **Zero Dependencies** — No runtime dependencies beyond React

## Installation

```bash
npm install react-access-engine
```

> Requires `react >= 18` as a peer dependency.

## Quick Start

### 1. Define your config

```typescript
import { defineAccess } from 'react-access-engine';

const config = defineAccess({
  roles: ['viewer', 'editor', 'admin'],
  permissions: {
    viewer: ['articles:read'],
    editor: ['articles:read', 'articles:write'],
    admin: ['*'],
  },
  plans: ['free', 'pro', 'enterprise'],
  features: {
    'dark-mode': true,
    'ai-assist': { enabled: true, allowedPlans: ['pro', 'enterprise'] },
    'beta-editor': { rolloutPercentage: 25 },
  },
});
```

### 2. Wrap your app

```tsx
import { AccessProvider } from 'react-access-engine';

function App() {
  return (
    <AccessProvider config={config} user={{ id: 'u1', roles: ['editor'], plan: 'pro' }}>
      <YourApp />
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
      {has('dark-mode') && <DarkTheme />}
      {tier('pro') && <AIAssistant />}
    </div>
  );
}
```

**Or use `<Allow>` — one component for all access control:**

```tsx
import { Allow } from 'react-access-engine';

function StorePage() {
  return (
    <>
      {/* Permission gate */}
      <Allow permission="articles:write" fallback={<ReadOnlyView />}>
        <Editor />
      </Allow>

      {/* Role gate */}
      <Allow role="admin">
        <AdminTools />
      </Allow>

      {/* Feature flag gate */}
      <Allow feature="dark-mode">
        <DarkTheme />
      </Allow>

      {/* Plan gate with upgrade prompt */}
      <Allow plan="pro" fallback={<UpgradePrompt />}>
        <ProFeatures />
      </Allow>

      {/* Combine conditions */}
      <Allow permission="analytics:view" plan="pro" match="all">
        <AnalyticsDashboard />
      </Allow>
    </>
  );
}
```

### More React Examples

**ABAC — resource-level access:**

```tsx
import { Can } from 'react-access-engine';

// Seller can only edit their own products
<Can perform="products:edit" on={{ sellerId: product.sellerId }}>
  <button>Edit Product</button>
</Can>

// Support can only refund recent orders
<Can perform="orders:refund" on={{ orderedAt: order.createdAt }}>
  <button>Process Refund</button>
</Can>
```

**Feature flags:**

```tsx
import { Feature } from 'react-access-engine';

<Feature name="live-chat" fallback={<EmailSupport />}>
  <LiveChat />
</Feature>;
```

**A/B experiments:**

```tsx
import { Experiment, useExperiment } from 'react-access-engine';

// Declarative
<Experiment
  id="checkout-redesign"
  variants={{ control: <CheckoutA />, redesign: <CheckoutB /> }}
  fallback={<CheckoutA />}
/>;

// Hook-based
function Checkout() {
  const { variant } = useExperiment('checkout-layout');
  return variant === 'single-page' ? <OnePageCheckout /> : <MultiStepCheckout />;
}
```

**Plan gating with upgrade prompt:**

```tsx
import { usePlan } from 'react-access-engine';

function AIRecommendations() {
  const { hasPlanAccess } = usePlan();

  if (!hasPlanAccess('pro')) {
    return <UpgradeBanner plan="pro" />;
  }
  return <AIPanel />;
}
```

## API Reference

### Config

- `defineAccess` — Create a fully typed access configuration
- `mergeConfigs` — Merge base config with overrides (remote patches)

### Components

- `AccessProvider` — Context provider — wraps your app
- `Allow` — Universal gate — permission, role, feature, plan
- `Can` — Permission gate with ABAC resource support
- `Feature` — Feature flag gate
- `Experiment` — A/B test variant renderer
- `AccessGate` — Multi-condition gate with mode (all/any)
- `PermissionGuard` — Route-level guard requiring all permissions
- `FeatureToggle` — Render-prop variant of Feature

### Hooks

- `useAccess()` — All-in-one access checking (`can`, `is`, `has`, `tier`)
- `usePermission(perm, resource?)` — Check a single permission
- `useRole()` — Role checking utilities
- `useFeature(name)` — Check a feature flag with reason
- `usePolicy(perm, resource?)` — Evaluate policy rules
- `useExperiment(id)` — Get experiment assignment
- `usePlan()` — Subscription plan checks
- `useAccessDebug()` — Debug metadata (when `debug: true`)
- `useRemoteConfig(base, loader)` — Remote config with SWR pattern

### Engines & Utilities

- `RemoteConfigEngine` — Programmatic remote config with polling & SWR
- `DebugEngine` — Event recording for devtools integration
- `evaluateCondition` / `evaluateConditions` — Evaluate ABAC conditions
- `buildConditionContext` — Build context from user/resource/env
- `AccessContext` — React Context for advanced integrations

### Backend / Node.js

All engine functions are **pure logic** — no React dependency. Use the same config on your server:

```typescript
import {
  hasPermission,
  hasRole,
  evaluateFeature,
  evaluatePolicy,
  assignExperiment,
  hasPlanAccess,
} from 'react-access-engine';

// Works in Express, Fastify, Deno, or any JS runtime
if (hasPermission(user, 'articles:read', config)) {
  /* allow */
}
if (evaluateFeature('ai-assist', user, config).enabled) {
  /* feature on */
}
if (hasPlanAccess(user, 'pro', config)) {
  /* plan ok */
}
```

**Express middleware example:**

```typescript
function requirePermission(...perms: string[]) {
  return (req, res, next) => {
    for (const perm of perms) {
      if (!hasPermission(req.user, perm, config)) {
        return res.status(403).json({ error: `Permission denied: ${perm}` });
      }
    }
    next();
  };
}

app.get('/api/articles', requirePermission('articles:read'), (req, res) => {
  res.json({ articles: getAllArticles() });
});

app.delete('/api/articles/:id', requirePermission('articles:delete'), (req, res) => {
  const article = getArticleById(req.params.id);
  const policy = evaluatePolicy('articles:delete', req.user, config, { resource: article });
  if (policy.effect === 'deny') {
    return res.status(403).json({ error: 'Policy denied', reason: policy.reason });
  }
  deleteArticle(req.params.id);
  res.json({ message: 'Deleted' });
});
```

All backend exports:

- **Roles** — `hasRole`, `hasAnyRole`, `hasAllRoles`
- **Permissions** — `hasPermission`, `hasAnyPermission`, `hasAllPermissions`, `getPermissionsForUser`
- **Features** — `evaluateFeature`, `evaluateAllFeatures`
- **Policies** — `evaluatePolicy`
- **Experiments** — `assignExperiment`
- **Plans** — `hasPlanAccess`, `getPlanTier`
- **Conditions** — `evaluateCondition`, `evaluateConditions`, `buildConditionContext`
- **Classes** — `PluginEngine`, `DebugEngine`

See the [full backend docs](https://github.com/abhishekayu/react-access-engine#backend--nodejs-usage) for shared config patterns, feature-gated endpoints, plan guards, ABAC policy evaluation, A/B experiments, and plugin usage on Node.js.

### Plugin Factories

- `createAuditLoggerPlugin` — Drop-in audit logging plugin
- `createAnalyticsPlugin` — Analytics event tracking plugin
- `createOperatorPlugin` — Register custom condition operators

### Type Inference Helpers

```typescript
import type {
  InferRoles,
  InferPermissions,
  InferFeatures,
  InferPlans,
  InferExperiments,
} from 'react-access-engine';

type Roles = InferRoles<typeof config>; // 'viewer' | 'editor' | 'admin'
type Perms = InferPermissions<typeof config>; // 'articles:read' | 'articles:write' | '*'
```

## Advanced Usage

See the [full documentation](https://react-access-engine.dev/docs) for details on:

- **ABAC Policies** — Composable allow/deny rules with resource conditions
- **Percentage Rollouts** — Deterministic feature rollouts based on user ID hashing
- **Feature Dependencies** — Features that require other features to be enabled
- **Remote Config** — Fetch & merge config from API with polling and signature verification
- **Condition Engine** — Declarative ABAC with built-in operators (equals, in, greaterThan, etc.)
- **Plugin System** — Audit logging, analytics, custom operators
- **Experiments** — A/B testing with deterministic variant assignment
- **SSR / Next.js** — Works with App Router, no client-only APIs in core

## DevTools

Install the companion devtools package for a development overlay:

```bash
npm install -D react-access-engine-devtools
```

```tsx
import { AccessDevtools } from 'react-access-engine-devtools';

<AccessProvider config={config} user={user}>
  <YourApp />
  <AccessDevtools />
</AccessProvider>;
```

## License

[MIT](https://github.com/abhishekayu/react-access-engine/blob/main/LICENSE) © [Abhishek Verma](https://github.com/abhishekayu)

---

[Changelog](https://github.com/abhishekayu/react-access-engine/blob/main/CHANGELOG.md) · [Contributing](https://github.com/abhishekayu/react-access-engine/blob/main/CONTRIBUTING.md) · [Security](https://github.com/abhishekayu/react-access-engine/blob/main/SECURITY.md)
