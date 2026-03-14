<div align="center">

# react-access-engine

**Unified access control, feature flags, and policy engine for React.**

[![npm version](https://img.shields.io/npm/v/react-access-engine?color=blue&label=npm)](https://www.npmjs.com/package/react-access-engine)
[![minzipped size](https://img.shields.io/badge/minzipped-5.7_kB-blue)](https://bundlephobia.com/package/react-access-engine)
[![CI](https://github.com/abhishekayu/react-access-engine/actions/workflows/ci.yml/badge.svg)](https://github.com/abhishekayu/react-access-engine/actions/workflows/ci.yml)
[![codecov](https://img.shields.io/badge/tests-220%20passing-brightgreen)](https://github.com/abhishekayu/react-access-engine)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

[Documentation](https://react-access-engine.dev) · [GitHub](https://github.com/abhishekayu/react-access-engine)

</div>

---

## Why?

React apps cobble together homegrown RBAC, a feature flag service, ad-hoc plan gating, and manual A/B test wiring — each with its own provider, API, and blind spots.

**react-access-engine** replaces all of them with one system:

```tsx
const { can, is, has, tier } = useAccess();

can('edit'); // check permission
is('admin'); // check role
has('dark-mode'); // check feature flag
tier('pro'); // check plan
```

## Features

| Category              | What you get                                                                       |
| --------------------- | ---------------------------------------------------------------------------------- |
| **RBAC**              | Multi-role users, role → permission mapping, wildcard permissions                  |
| **ABAC**              | Attribute-based policies with allow/deny rules and custom condition operators      |
| **Feature Flags**     | Boolean toggles, percentage rollouts, role/plan/environment targeting              |
| **Experiments**       | A/B testing with deterministic variant assignment, SSR-safe hashing                |
| **Plan Gating**       | Hierarchical subscription tiers with automatic comparison                          |
| **Remote Config**     | Fetch config from API with stale-while-revalidate, polling, signature verification |
| **Condition Engine**  | Declarative ABAC with built-in operators (equals, in, greaterThan, etc.)           |
| **Plugin System**     | Lifecycle hooks for audit logging, analytics, custom operators                     |
| **DevTools**          | Optional overlay for inspecting access decisions in real time                      |
| **Type Safety**       | Full TypeScript inference — `InferRoles`, `InferPermissions`, `InferFeatures`      |
| **SSR-Ready**         | Deterministic evaluation, works with Next.js App Router                            |
| **Tree-Shakeable**    | Import only what you use — unused engines are eliminated at build time             |
| **Zero Dependencies** | No runtime dependencies beyond React                                               |

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

```tsx
import { useAccess, Allow } from 'react-access-engine';

function Dashboard() {
  const { can, is, has, tier } = useAccess();

  return (
    <div>
      {can('articles:write') && <button>New Article</button>}
      {tier('pro') && <AIAssistant />}

      <Allow permission="articles:write" fallback={<ReadOnlyView />}>
        <Editor />
      </Allow>
    </div>
  );
}
```

## API Reference

### Config

| Export         | Description                                       |
| -------------- | ------------------------------------------------- |
| `defineAccess` | Create a fully typed access configuration         |
| `mergeConfigs` | Merge base config with overrides (remote patches) |

### Components

| Component         | Description                                      |
| ----------------- | ------------------------------------------------ |
| `AccessProvider`  | Context provider — wraps your app                |
| `Allow`           | Universal gate — permission, role, feature, plan |
| `Can`             | Permission gate with ABAC resource support       |
| `Feature`         | Feature flag gate                                |
| `Experiment`      | A/B test variant renderer                        |
| `AccessGate`      | Multi-condition gate with mode (all/any)         |
| `PermissionGuard` | Route-level guard requiring all permissions      |
| `FeatureToggle`   | Render-prop variant of Feature                   |

### Hooks

| Hook                             | Returns                                       | Purpose                             |
| -------------------------------- | --------------------------------------------- | ----------------------------------- |
| `useAccess()`                    | `{ can, is, has, tier, user, ... }`           | All-in-one access checking          |
| `usePermission(perm, resource?)` | `boolean`                                     | Check a single permission           |
| `useRole()`                      | `{ roles, hasRole, hasAnyRole, hasAllRoles }` | Role checking utilities             |
| `useFeature(name)`               | `{ enabled, reason }`                         | Check a feature flag with reason    |
| `usePolicy(perm, resource?)`     | `{ allowed, matchedRule, reason }`            | Evaluate policy rules               |
| `useExperiment(id)`              | `{ variant, active, experimentId }`           | Get experiment assignment           |
| `usePlan()`                      | `{ plan, hasPlanAccess }`                     | Subscription plan checks            |
| `useAccessDebug()`               | `AccessDebugInfo`                             | Debug metadata (when `debug: true`) |
| `useRemoteConfig(base, loader)`  | `{ config, loading, error, stale, refresh }`  | Remote config with SWR pattern      |

### Engines & Utilities

| Export                  | Description                                   |
| ----------------------- | --------------------------------------------- |
| `RemoteConfigEngine`    | Programmatic remote config with polling & SWR |
| `DebugEngine`           | Event recording for devtools integration      |
| `evaluateCondition`     | Evaluate a single ABAC condition entry        |
| `evaluateConditions`    | Evaluate multiple conditions (implicit AND)   |
| `buildConditionContext` | Build context from user/resource/env          |
| `AccessContext`         | React Context for advanced integrations       |

### Plugin Factories

| Export                    | Description                         |
| ------------------------- | ----------------------------------- |
| `createAuditLoggerPlugin` | Drop-in audit logging plugin        |
| `createAnalyticsPlugin`   | Analytics event tracking plugin     |
| `createOperatorPlugin`    | Register custom condition operators |

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

See the [full documentation](https://react-access-engine.dev/docs) for:

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

[MIT](https://github.com/abhishekayu/react-access-engine/blob/main/LICENSE) © [Abhishek](https://github.com/abhishekayu)
