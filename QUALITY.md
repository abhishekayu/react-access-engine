# Quality & Release Readiness

> Pre-release quality gates for `react-access-control` v0.1.0

---

## 1. Test Coverage Summary

| Area                 | File                           | Tests   | Coverage                                                                                         |
| -------------------- | ------------------------------ | ------- | ------------------------------------------------------------------------------------------------ |
| Role engine          | `role-engine.test.ts`          | 8       | hasRole, hasAnyRole, hasAllRoles, getPermissionsForUser (dedup)                                  |
| Permission engine    | `permission-engine.test.ts`    | 8       | hasPermission, wildcards (`*`, `ns:*`), hasAny/hasAll                                            |
| Policy engine        | `policy-engine.test.ts`        | 9       | ABAC conditions, priority, scopes (role/plan/env), error handling                                |
| Feature engine       | `feature-engine.test.ts`       | 14      | Boolean, rollout %, role/plan/env gating, dependencies, circular deps                            |
| Experiment engine    | `experiment-engine.test.ts`    | 4       | Deterministic assignment, allocation distribution                                                |
| Plan engine          | `plan-engine.test.ts`          | 7       | Tier comparison, unknown plan, no hierarchy                                                      |
| Hash utility         | `hash.test.ts`                 | 4       | Deterministic, non-negative, distribution                                                        |
| **Condition engine** | `condition-engine.test.ts`     | **21**  | All 10 operators, AND/OR/nested groups, custom operators, unknown ops                            |
| **Plugin engine**    | `plugin-engine.test.ts`        | **14**  | All 6 event types, error isolation, collectOperators                                             |
| **Debug engine**     | `debug-engine.test.ts`         | **17**  | Recording, MAX_ENTRIES cap, subscribe/unsubscribe, clear                                         |
| **Remote config**    | `remote-config-engine.test.ts` | **12**  | Load, stale-while-revalidate, polling, refresh, destroy                                          |
| **resolve-path**     | `resolve-path.test.ts`         | **9**   | Nested paths, arrays, null/undefined, empty path                                                 |
| **Built-in plugins** | `plugins.test.ts`              | **13**  | Audit logger, analytics adapter, operator plugin                                                 |
| Components           | `components.test.tsx`          | 34      | Can, Feature, AccessGate, PermissionGuard, Experiment, error boundary                            |
| Hooks                | `hooks.test.tsx`               | 20      | useAccess, usePermission, useRole, useFeature, usePolicy, useExperiment, usePlan, useAccessDebug |
| **Integration**      | `integration.test.tsx`         | **8**   | Nested providers, mergeConfigs, SSR safety, plugin events                                        |
| **Total**            | **16 files**                   | **202** |                                                                                                  |

### What's covered

- **RBAC**: Role → permission mapping, wildcard matching, namespace wildcards
- **ABAC**: Condition engine with all 10 built-in operators (equals, notEquals, in, notIn, includes, greaterThan, lessThan, gte, lte, exists), AND/OR condition groups, nested groups, custom operators via plugins
- **Feature flags**: Boolean, percentage rollout (deterministic hash), role/plan/environment gating, dependency resolution, circular dependency detection
- **Experiments**: Deterministic variant assignment via DJB2 hash, custom allocation percentages, inactive experiments
- **Policy engine**: Priority-based rule evaluation, ABAC conditions, scope matching (role, plan, environment), error isolation in condition functions
- **Components**: All 7 components (AccessProvider, Can, Feature, AccessGate, PermissionGuard, FeatureToggle, Experiment) with fallback rendering, mode=all/any
- **Hooks**: All 9 public hooks with type safety
- **Plugin system**: 6 event types with error isolation, operator collection, 3 built-in plugins
- **Debug system**: Event recording, 100-entry cap, push-based subscriptions, clear
- **Remote config**: Custom loader, polling, stale-while-revalidate, error handling
- **Integration**: Nested providers, config merging, SSR safety, plugin event flow through components

---

## 2. Rerender Strategy

### Current approach

| Technique                                                           | Where          | Why                                                                                 |
| ------------------------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------- |
| `useMemo` on `userPermissions`                                      | AccessProvider | Recomputed only when `roles` or `permissions` config change                         |
| `useMemo` on `featureResults`                                       | AccessProvider | Recomputed only when `userId`, `roles`, `plan`, `features`, or `environment` change |
| `useStableValue` for roles array                                    | AccessProvider | Prevents spurious recomputation when `roles` array is recreated with same values    |
| `useCallback` on `checkPermission`, `checkFeature`, `getExperiment` | AccessProvider | Stable function references across renders                                           |
| `useMemo` on context value                                          | AccessProvider | Prevents unnecessary context propagation                                            |

### What this means

- **Child components only re-render when the access context actually changes** (new user, new config, or new role/plan).
- `usePermission('articles:read')` returns a memoized boolean — it won't cause re-renders on its own.
- Feature evaluation is done once per provider render (all features pre-computed), not per `useFeature()` call.
- The `useStableValue` hook ensures that `['editor']` !== `['editor']` (referential inequality from parent re-renders) doesn't cascade.

### Recommendations for v1.0

- Add `React.memo` wrappers to `Can`, `Feature`, `AccessGate` components for cases where parent re-renders frequently.
- Consider `useSyncExternalStore` for the debug engine subscription (already used in devtools package).
- Benchmark with React DevTools Profiler to validate real-world rerender counts.

---

## 3. Bundle Size Strategy

### Current architecture

- **Zero runtime dependencies** — only React as a peer dependency.
- **Dual ESM/CJS output** via tsup with tree-shaking and code splitting.
- **`sideEffects: false`** in package.json — enables dead code elimination.
- **Separate engine modules** — each engine is tree-shakeable. If you only use roles/permissions, the experiment/policy/remote-config engines are eliminated.
- **Dev-only warnings** — `warnOnce` and `warn` are tree-shaken in production (predicated on `process.env.NODE_ENV`).
- **`'use client'` directives** — on all components and hooks for RSC compatibility.

### Measured sizes (from build output)

| Package                          | ESM    | CJS    | DTS |
| -------------------------------- | ------ | ------ | --- |
| `react-access-control`           | ~15 KB | ~17 KB | ✅  |
| `@react-access-control/devtools` | ~30 KB | ~32 KB | ✅  |

_Sizes are uncompressed. Gzipped sizes are typically 40-60% smaller._

### Recommendations

- Add `size-limit` CI check to prevent regressions (target: <5 KB gzipped for core).
- Consider separate entry points for advanced features (`/policies`, `/experiments`) if core bundle grows.

---

## 4. SSR Safety

| Requirement                                | Status            |
| ------------------------------------------ | ----------------- |
| No `window` access in engines              | ✅                |
| No `document` access in engines            | ✅                |
| No `Math.random()` — deterministic hashing | ✅ DJB2 hash      |
| `'use client'` on all components/hooks     | ✅                |
| Server-side rendering works in jsdom       | ✅ Tested         |
| Next.js App Router compatible              | ✅ Example exists |

---

## 5. Developer Ergonomics

### Type safety

- `defineAccess()` infers literal types for roles, permissions, features, plans, and experiments via `const` generics.
- `InferRoles<T>`, `InferPermissions<T>`, etc. extract types from a config object.
- All hooks and components accept the inferred types — IDE autocomplete works out of the box.

### Dev warnings

- **Missing provider**: `useAccess()` outside `<AccessProvider>` throws a clear `[react-access-control]` prefixed error.
- **Empty roles**: Warning when `AccessProvider` receives an empty roles array.
- **Nested providers**: Warning when a nested `<AccessProvider>` is detected, suggesting `mergeConfigs()`.
- **Unknown features**: Warning when `useFeature()` or `checkFeature()` is called with a feature name not in the config.
- **Unknown experiments**: Warning when `getExperiment()` is called with an unknown experiment ID.
- **Tree-shaken in production**: All warnings use `process.env.NODE_ENV` guards.

### Plugin system

- 3 built-in plugins ready to use: audit logger, analytics adapter, custom operators.
- Plugin errors never break the application — all plugin calls are wrapped in try/catch.
- Custom operators extend the condition engine without modifying core code.

---

## 6. QA Checklist — Before v0.1.0

### Must-pass

- [x] All 202 tests pass (`vitest run`)
- [x] TypeScript strict mode passes (`tsc --noEmit`)
- [x] Build succeeds for all packages (`turbo run build`)
- [x] Dual ESM/CJS output verified
- [x] DTS (declaration files) generated
- [x] `sideEffects: false` in package.json
- [x] `'use client'` directives on all components/hooks
- [x] No runtime dependencies beyond React peer dep
- [x] Examples compile and render correctly
- [x] Playground app works with all control combinations

### Should-do before public release

- [ ] Add `size-limit` CI check
- [ ] Add GitHub Actions CI workflow (test + build + typecheck)
- [ ] Generate API documentation from TSDoc comments
- [ ] Add CONTRIBUTING.md
- [ ] Add CHANGELOG.md via changesets
- [ ] Publish `0.1.0-beta.1` to npm for validation
- [ ] Test with React 18 (not just React 19)
- [ ] Add `eslint-plugin-react-hooks` exhaustive-deps audit
- [ ] Add integration test with Next.js build

### Nice-to-have for v1.0

- [ ] Benchmark suite (rerender counts, provider mount time)
- [ ] Storybook integration for component documentation
- [ ] Visual regression tests for devtools overlay
- [ ] WebSocket-based remote config transport
- [ ] React Native compatibility testing

---

## 7. Example Apps Overview

| Example         | Directory                   | What it demonstrates                                                                                                |
| --------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Basic RBAC      | `examples/basic/`           | Role → permission mapping, `Can`, `Feature`, hooks                                                                  |
| SaaS Dashboard  | `examples/saas-dashboard/`  | Multi-role, plan hierarchy, plan-gated features, role/plan switcher                                                 |
| Feature Rollout | `examples/feature-rollout/` | Percentage rollout, role/plan gating, user ID cohort switching                                                      |
| A/B Experiments | `examples/experiments/`     | Multi-variant experiments, deterministic assignment, inactive experiments                                           |
| ABAC Policies   | `examples/abac-policies/`   | Owner-only editing, department scoping, archived document deny, policy evaluation results                           |
| Next.js SSR     | `examples/nextjs/`          | App Router integration, Server/Client Components, `'use client'` pattern                                            |
| Playground      | `apps/playground/`          | Full interactive explorer with all tabs: identity, permissions, features, experiments, gates, policies, debug trace |

---

## 8. Architecture Decisions Record

| Decision                            | Rationale                                                                  |
| ----------------------------------- | -------------------------------------------------------------------------- |
| DJB2 hash for rollout/experiments   | Deterministic, SSR-safe, no crypto dependency, good distribution           |
| Single context provider             | Simplicity over micro-contexts; memoization prevents unnecessary rerenders |
| Policy engine separate from RBAC    | Policies are opt-in; basic RBAC works without them                         |
| Plugin errors silenced              | Library must never crash the host application                              |
| 100-event debug cap                 | Prevent memory leaks in long-running apps                                  |
| `'use client'` on all React exports | Required for Next.js RSC compatibility                                     |
| `as const` in `defineAccess()`      | Enables literal type inference without extra generics                      |
