# react-access-engine — Architecture Document

## Product Positioning

**react-access-engine** is a unified React-first access and feature management platform.

It combines RBAC, ABAC, feature flags, experiments, policy evaluation, and subscription-gated
access into a single, tree-shakeable, type-safe library with declarative components and hooks.

### Problem Statement

React applications cobble together:

- Homegrown RBAC checks (`if (user.role === 'admin')`)
- Separate feature flag services (LaunchDarkly, Unleash)
- Ad-hoc subscription/plan gating
- Manual A/B test wiring
- No unified audit trail

**react-access-engine** replaces all of this with one coherent, type-safe system.

### Differentiation

| Dimension     | Typical RBAC lib    | Feature flag tool | react-access-engine     |
| ------------- | ------------------- | ----------------- | ------------------------ |
| Access model  | Roles → permissions | Boolean flags     | RBAC + ABAC + policies   |
| Feature flags | None                | Yes               | Built-in with rollouts   |
| Experiments   | None                | Sometimes         | First-class A/B testing  |
| Typing        | Loose strings       | Loose strings     | Inferred literal types   |
| Remote config | None                | Proprietary       | Open loader protocol     |
| Audit         | None                | Proprietary       | Event hooks + debug meta |
| Architecture  | Single context blob | SDK-specific      | Tree-shakeable engines   |
| SSR           | Often broken        | Varies            | Server-safe by design    |

---

## Internal Architecture

### Engine Modules

```
┌─────────────────────────────────────────────────────┐
│                   AccessProvider                     │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ Role     │  │Permission│  │  Policy Engine     │  │
│  │ Engine   │  │ Engine   │  │  (ABAC + rules)    │  │
│  └──────────┘  └──────────┘  └───────────────────┘  │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ Feature  │  │ Rollout  │  │ Experiment Engine  │  │
│  │ Engine   │  │ Engine   │  │ (A/B testing)      │  │
│  └──────────┘  └──────────┘  └───────────────────┘  │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ Remote   │  │ Plugin   │  │  Debug Metadata    │  │
│  │ Config   │  │ Engine   │  │  Engine            │  │
│  └──────────┘  └──────────┘  └───────────────────┘  │
└─────────────────────────────────────────────────────┘
```

Each engine is a pure function module. They are tree-shakeable — if you don't use
feature flags, the feature engine is not bundled.

### Data Flow

```
Config → Engines → Context → Hooks/Components → UI
                      ↑
              Remote Config Loader (optional)
                      ↑
              Plugin Events (optional)
```

---

## TypeScript Architecture

All public APIs use a single generic `TConfig` that flows through the system:

```typescript
const config = defineAccess({
  roles: ['admin', 'editor', 'viewer'] as const,
  permissions: { ... },
  features: { ... },
}) // TConfig is inferred — role names, feature names, permission names autocomplete
```

This gives:

- `useRole()` returns `'admin' | 'editor' | 'viewer'`
- `useFeature('dark-mode')` autocompletes feature names
- `<Can perform="articles:edit">` autocompletes permission strings

---

## Performance Strategy

1. **Split contexts** — roles, permissions, features, policies in separate React contexts
   so a feature flag change doesn't rerender permission-checking components
2. **Memoized engines** — engine evaluation results are memoized with shallow comparison
3. **Stable references** — hook return values use `useMemo` / `useRef` to avoid
   unnecessary rerenders downstream
4. **Tree-shaking** — each engine is a separate module; unused engines are eliminated
5. **Lazy evaluation** — policies and experiments are evaluated on demand, not eagerly

---

## SSR Strategy

1. All hooks return deterministic values from config on first render (no `useEffect` needed)
2. No `window` / `document` / `localStorage` access in core evaluation
3. Remote config supports server-side fetching (pass resolved config to provider)
4. Rollout engine uses stable user ID hashing, not `Math.random()`
5. `<Feature>` renders `fallback` on server when rollout is percentage-based and no user context
6. Full React Server Component compatibility — provider is a Client Component boundary

---

## Version Scope

### v0.1 (MVP)

- AccessProvider, Can, Feature components
- useAccess, usePermission, useRole, useFeature hooks
- Role engine, permission engine, feature flag engine
- Full TypeScript inference
- ESM + CJS builds
- SSR safe

### v1.0

- All MVP features
- ABAC conditions
- Policy engine
- Experiments / A/B
- Percentage rollouts
- Feature dependencies
- Subscription/plan gating
- Environment rules
- Plugin system + event hooks
- Remote config protocol
- Debug metadata + useAccessDebug
- AccessGate, PermissionGuard, Experiment, FeatureToggle components

### What to avoid in v0.1

- No DevTools UI (complexity)
- No Chrome extension
- No CLI tools
- No middleware (keep it React-only)
- No React Native specific code
- No persistence layer
