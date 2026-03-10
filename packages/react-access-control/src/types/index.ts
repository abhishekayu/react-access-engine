// ---------------------------------------------------------------------------
// Core configuration types for react-access-control
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Condition Engine types — declarative operator-based conditions
// ---------------------------------------------------------------------------

/** Built-in condition operators */
export type ConditionOperator =
  | 'equals'
  | 'notEquals'
  | 'in'
  | 'notIn'
  | 'includes'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'exists';

/** A single field-level condition check */
export interface ConditionCheck {
  /** Dot-path to a field in the context object (e.g. `"user.plan"`, `"resource.ownerId"`) */
  field: string;
  /** Operator to apply */
  operator: ConditionOperator | (string & {});
  /** Value to compare against */
  value?: unknown;
}

/** AND group — all children must pass */
export interface ConditionGroupAnd {
  and: readonly ConditionEntry[];
}

/** OR group — at least one child must pass */
export interface ConditionGroupOr {
  or: readonly ConditionEntry[];
}

/** A condition entry: a single check, AND group, or OR group */
export type ConditionEntry = ConditionCheck | ConditionGroupAnd | ConditionGroupOr;

/** A custom operator that can be registered via plugins or config */
export interface CustomOperator {
  name: string;
  evaluate: (fieldValue: unknown, conditionValue: unknown) => boolean;
}

/** Render-denied event emitted by the plugin system */
export interface RenderDeniedEvent {
  /** Component name (e.g. "Can", "Feature", "AccessGate") */
  component: string;
  /** Why access was denied */
  reason: string;
  /** Arbitrary metadata */
  meta?: Record<string, unknown>;
  timestamp: number;
}

/**
 * A permission condition function for ABAC.
 * Receives the resource attributes and user context, returns boolean.
 */
export type PermissionCondition<
  TContext extends Record<string, unknown> = Record<string, unknown>,
> = (ctx: {
  user: UserContext<string, string>;
  resource: Record<string, unknown>;
  environment: EnvironmentContext;
  context: TContext;
}) => boolean;

/** Environment context for environment-aware rules */
export interface EnvironmentContext {
  name: string;
  [key: string]: unknown;
}

/** User context passed into the provider */
export interface UserContext<TRole extends string = string, TPlan extends string = string> {
  id: string;
  roles: readonly TRole[];
  plan?: TPlan;
  attributes?: Record<string, unknown>;
}

/** A single feature flag definition */
export interface FeatureDefinition {
  /** Whether the feature is enabled (simple boolean) */
  enabled?: boolean;
  /** Percentage-based rollout (0-100) */
  rolloutPercentage?: number;
  /** Features that must be enabled for this feature to activate */
  dependencies?: readonly string[];
  /** Restrict to specific roles */
  allowedRoles?: readonly string[];
  /** Restrict to specific plans */
  allowedPlans?: readonly string[];
  /** Restrict to specific environments */
  allowedEnvironments?: readonly string[];
  /** Arbitrary metadata */
  metadata?: Record<string, unknown>;
}

/** An experiment definition for A/B testing */
export interface ExperimentDefinition<TVariant extends string = string> {
  /** Unique experiment identifier */
  id: string;
  /** Available variants */
  variants: readonly TVariant[];
  /** Default variant (control) */
  defaultVariant: TVariant;
  /** Whether the experiment is active */
  active?: boolean;
  /** Percentage allocation per variant (must sum to 100) */
  allocation?: Partial<Record<TVariant, number>>;
}

/** A policy rule for the policy engine */
export interface PolicyRule<TContext extends Record<string, unknown> = Record<string, unknown>> {
  /** Rule identifier */
  id: string;
  /** Rule effect */
  effect: 'allow' | 'deny';
  /** Permissions this rule applies to */
  permissions?: readonly string[];
  /** Roles this rule applies to */
  roles?: readonly string[];
  /** Plans this rule applies to */
  plans?: readonly string[];
  /** Environments this rule applies to */
  environments?: readonly string[];
  /** Custom condition function */
  condition?: PermissionCondition<TContext>;
  /** Priority (higher = evaluated first, default 0) */
  priority?: number;
  /** Human-readable description */
  description?: string;
}

/** Plugin hook interface */
export interface AccessPlugin {
  name: string;
  onAccessCheck?: (event: AccessCheckEvent) => void;
  onFeatureEvaluate?: (event: FeatureEvaluateEvent) => void;
  onPolicyEvaluate?: (event: PolicyEvaluateEvent) => void;
  onExperimentAssign?: (event: ExperimentAssignEvent) => void;
  onConfigLoad?: (event: ConfigLoadEvent) => void;
  /** Called when a component denies rendering */
  onRenderDenied?: (event: RenderDeniedEvent) => void;
  /** Custom operators this plugin provides */
  operators?: readonly CustomOperator[];
}

/** Events emitted by the system */
export interface AccessCheckEvent {
  permission: string;
  granted: boolean;
  roles: readonly string[];
  resource?: Record<string, unknown>;
  timestamp: number;
  reason?: string;
  /** Structured reason code */
  reasonCode?: string;
}

export interface FeatureEvaluateEvent {
  feature: string;
  enabled: boolean;
  reason: 'static' | 'rollout' | 'role' | 'plan' | 'environment' | 'dependency' | 'disabled';
  /** Segment that matched, if any */
  segment?: string;
  timestamp: number;
}

export interface PolicyEvaluateEvent {
  permission: string;
  effect: 'allow' | 'deny';
  matchedRule: string | null;
  /** Named policy that matched, if any */
  matchedPolicy?: string;
  /** Structured reason code */
  reasonCode?: string;
  timestamp: number;
}

export interface ExperimentAssignEvent {
  experimentId: string;
  variant: string;
  userId: string;
  timestamp: number;
}

export interface ConfigLoadEvent {
  source: string;
  timestamp: number;
  /** Whether the loaded data is stale (served from cache after error) */
  stale?: boolean;
}

/** Remote config loader interface */
export interface RemoteConfigLoader<TConfig extends AccessConfig = AccessConfig> {
  /** Custom loader function */
  load: () => Promise<Partial<TConfig>>;
  /** Load from a URL instead of a custom function */
  url?: string;
  /** Fetch options passed to the URL loader */
  fetchOptions?: RequestInit;
  /** Optional polling interval in ms */
  pollInterval?: number;
  /** Verify the integrity of the fetched config payload */
  verifySignature?: (payload: string, signature: string) => boolean | Promise<boolean>;
  /** Header name containing the signature. Defaults to `'x-config-signature'`. */
  signatureHeader?: string;
}

/** Consumer-facing state for remote config loading */
export interface RemoteConfigState {
  /** Whether the initial load is in progress */
  loading: boolean;
  /** Last error, if any */
  error: Error | null;
  /** True when serving cached data after a failed refresh */
  stale: boolean;
  /** Timestamp of the last successful load */
  lastLoadedAt: number | null;
  /** Trigger a manual refresh */
  refresh: () => Promise<void>;
}

/** Debug metadata for access decisions */
export interface AccessDebugInfo {
  lastChecks: AccessCheckEvent[];
  lastFeatureEvals: FeatureEvaluateEvent[];
  lastPolicyEvals: PolicyEvaluateEvent[];
  configSnapshot: AccessConfig;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Main configuration — the single source of truth
// ---------------------------------------------------------------------------

export interface AccessConfig<
  TRole extends string = string,
  TPermission extends string = string,
  TFeature extends string = string,
  TPlan extends string = string,
  TExperimentId extends string = string,
> {
  /** Role definitions */
  roles: readonly TRole[];

  /** Role → permission mapping */
  permissions: Partial<Record<TRole, readonly TPermission[]>>;

  /** Feature flag definitions */
  features?: Partial<Record<TFeature, FeatureDefinition | boolean>>;

  /** Experiment definitions */
  experiments?: Record<TExperimentId, ExperimentDefinition>;

  /** Policy rules for fine-grained access control */
  policies?: readonly PolicyRule[];

  /** Subscription/plan hierarchy (ordered low → high) */
  plans?: readonly TPlan[];

  /** Environment context */
  environment?: EnvironmentContext;

  /** Plugins */
  plugins?: readonly AccessPlugin[];

  /** Remote config loader */
  remoteConfigLoader?: RemoteConfigLoader;

  /** Enable debug mode */
  debug?: boolean;
}

// ---------------------------------------------------------------------------
// Type inference helpers
// ---------------------------------------------------------------------------

/** Extract role literal union from a config */
export type InferRoles<T> =
  T extends AccessConfig<infer R, string, string, string, string> ? R : string;

/** Extract permission literal union from a config */
export type InferPermissions<T> =
  T extends AccessConfig<string, infer P, string, string, string> ? P : string;

/** Extract feature name literal union from a config */
export type InferFeatures<T> =
  T extends AccessConfig<string, string, infer F, string, string> ? F : string;

/** Extract plan literal union from a config */
export type InferPlans<T> =
  T extends AccessConfig<string, string, string, infer Pl, string> ? Pl : string;

/** Extract experiment id literal union from a config */
export type InferExperiments<T> =
  T extends AccessConfig<string, string, string, string, infer E> ? E : string;

// ---------------------------------------------------------------------------
// defineAccess — config factory for type inference
// ---------------------------------------------------------------------------

/**
 * Creates a fully typed access configuration.
 * All role, permission, feature, and plan names are inferred as literal types.
 *
 * @example
 * ```ts
 * const config = defineAccess({
 *   roles: ['admin', 'editor', 'viewer'] as const,
 *   permissions: {
 *     admin: ['*'] as const,
 *     editor: ['articles:read', 'articles:write'] as const,
 *     viewer: ['articles:read'] as const,
 *   },
 *   features: {
 *     'dark-mode': { enabled: true },
 *     'new-editor': { rolloutPercentage: 50 },
 *   },
 * });
 * ```
 */
export function defineAccess<
  const TRole extends string,
  const TPermission extends string,
  const TFeature extends string,
  const TPlan extends string,
  const TExperiment extends string,
>(
  config: AccessConfig<TRole, TPermission, TFeature, TPlan, TExperiment>,
): AccessConfig<TRole, TPermission, TFeature, TPlan, TExperiment> {
  return config;
}

// ---------------------------------------------------------------------------
// Provider props
// ---------------------------------------------------------------------------

export interface AccessProviderProps<
  TRole extends string = string,
  TPermission extends string = string,
  TFeature extends string = string,
  TPlan extends string = string,
  TExperiment extends string = string,
> {
  config: AccessConfig<TRole, TPermission, TFeature, TPlan, TExperiment>;
  user: UserContext<TRole, TPlan>;
  children: React.ReactNode;
}

// ---------------------------------------------------------------------------
// mergeConfigs — utility for nested / composed providers
// ---------------------------------------------------------------------------

/**
 * Shallow-merge two access configs. The `overrides` patch is applied on top
 * of `base`. Object-valued fields (features, experiments, permissions) are
 * merged at one level; arrays (roles, plans, policies, plugins) from the
 * override replace the base value entirely when provided.
 *
 * @example
 * ```ts
 * const inner = mergeConfigs(baseConfig, {
 *   features: { 'beta-ui': { enabled: true } },
 *   debug: true,
 * });
 * ```
 */
export function mergeConfigs<
  TRole extends string = string,
  TPermission extends string = string,
  TFeature extends string = string,
  TPlan extends string = string,
  TExperiment extends string = string,
>(
  base: AccessConfig<TRole, TPermission, TFeature, TPlan, TExperiment>,
  overrides: Partial<AccessConfig<TRole, TPermission, TFeature, TPlan, TExperiment>>,
): AccessConfig<TRole, TPermission, TFeature, TPlan, TExperiment> {
  return {
    ...base,
    ...overrides,
    permissions: { ...base.permissions, ...overrides.permissions },
    features: { ...base.features, ...overrides.features } as typeof base.features,
    experiments: { ...base.experiments, ...overrides.experiments } as typeof base.experiments,
  };
}
