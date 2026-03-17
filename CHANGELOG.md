# Changelog

All notable changes to this project will be documented in this file.

This project uses [Changesets](https://github.com/changesets/changesets) for version management.

## [1.0.0] - 2026-03-17

### Major Release 🎉

First stable release — production-ready unified access control for React, Next.js & Node.js.

### Added

- SEO-optimized package metadata and documentation
- Playground link in all READMEs
- Descriptive image alt text for accessibility and SEO
- License section in devtools README

### Changed

- Documentation links updated to `react-access-engine.dev/docs`
- Package description expanded to cover Node.js, Next.js, Express, Fastify
- npm keywords expanded from 24 to 34 (main) and 20 to 25 (devtools)
- Fixed duplicate keyword line in package README
- Devtools description enriched with RBAC/ABAC/feature-flags mentions

### No Breaking Changes

All existing APIs remain identical. This release marks API stability.

## [0.1.4] - 2026-03-17

### Added

- Backend / Node.js engine functions — same config, same logic, no React dependency
  - `hasPermission`, `hasRole`, `hasAnyRole`, `hasAllRoles`, `hasAnyPermission`, `hasAllPermissions`
  - `evaluateFeature`, `evaluateAllFeatures`
  - `evaluatePolicy`
  - `assignExperiment`
  - `hasPlanAccess`, `getPlanTier`
  - `getPermissionsForUser`
  - `PluginEngine`, `DebugEngine`
  - `evaluateCondition`, `evaluateConditions`, `buildConditionContext`
- Shared config pattern — define once, use on frontend and backend
- Express middleware examples for permission guards, feature gates, plan gates
- Demo apps (`demo-api`, `demo-web`, `shared-config`)
- 400+ new tests (620 total across 18 test files)
- `SECURITY.md`, `ARCHITECTURE.md`, `QUALITY.md` documentation

### Changed

- Package restructured from multi-package to single `react-access-engine` package
- All engine functions are now pure exports (no React dependency)
- README updated with full backend documentation

## [0.1.3] - 2026-03-10

### Added

- Condition Engine with declarative ABAC (`evaluateCondition`, `evaluateConditions`, `buildConditionContext`)
- 10 built-in operators: `equals`, `notEquals`, `in`, `notIn`, `includes`, `greaterThan`, `lessThan`, `greaterThanOrEqual`, `lessThanOrEqual`, `exists`
- `createOperatorPlugin` for custom condition operators
- Remote Config Engine with stale-while-revalidate, polling, and signature verification
- `useRemoteConfig` hook
- `mergeConfigs` utility
- Plugin factories: `createAuditLoggerPlugin`, `createAnalyticsPlugin`

## [0.1.2] - 2026-03-05

### Added

- Policy Engine (ABAC) with composable allow/deny rules and priority ordering
- `usePolicy` hook
- Experiment Engine with deterministic variant assignment (SSR-safe hashing)
- `<Experiment>` component and `useExperiment` hook
- Plugin system with lifecycle hooks (`onAccessCheck`, `onFeatureEvaluate`, `onExperimentAssign`)
- Debug Engine and `useAccessDebug` hook
- DevTools overlay package (`react-access-engine-devtools`)

## [0.1.1] - 2026-02-28

### Added

- Feature flag engine with percentage rollouts, role/plan/environment targeting, and dependencies
- Plan engine with hierarchical subscription tiers
- `<Feature>`, `<FeatureToggle>`, `<AccessGate>`, `<PermissionGuard>` components
- `useFeature`, `usePlan` hooks
- `<Allow>` universal gate component

## [0.1.0] - 2026-02-20

### Added

- Initial release
- RBAC engine with multi-role users, role → permission mapping, wildcard permissions
- `AccessProvider`, `<Can>` component
- `useAccess`, `usePermission`, `useRole` hooks
- `defineAccess` config builder with full TypeScript inference
- Type helpers: `InferRoles`, `InferPermissions`, `InferFeatures`, `InferPlans`, `InferExperiments`
- Tree-shakeable ESM + CJS + DTS builds via tsup
- SSR-safe — no `window`, `document`, or `Math.random()` in core
- Zero runtime dependencies beyond React
