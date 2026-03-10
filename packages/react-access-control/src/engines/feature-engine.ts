import type { AccessConfig, EnvironmentContext, FeatureDefinition, UserContext } from '../types';
import { hashUserId } from '../utils/hash';

// ---------------------------------------------------------------------------
// Feature Flag Engine
// ---------------------------------------------------------------------------
// Evaluates feature flags with support for:
// - Simple boolean flags
// - Role-based feature gating
// - Plan-based feature gating
// - Percentage-based rollouts (deterministic by user ID)
// - Feature dependencies
// - Environment restrictions
// ---------------------------------------------------------------------------

export interface FeatureEvalResult {
  enabled: boolean;
  reason: 'static' | 'rollout' | 'role' | 'plan' | 'environment' | 'dependency' | 'disabled';
}

/**
 * Evaluate whether a feature is enabled for a given user context.
 */
export function evaluateFeature<
  TRole extends string,
  TFeature extends string,
  TPlan extends string,
>(
  featureName: TFeature,
  user: UserContext<TRole, TPlan>,
  config: Pick<AccessConfig<TRole, string, TFeature, TPlan>, 'features'>,
  environment?: EnvironmentContext,
  /** Pass to check dependencies — a map of already-resolved features */
  resolvedFeatures?: ReadonlyMap<string, boolean>,
): FeatureEvalResult {
  const features = config.features;
  if (!features) {
    return { enabled: false, reason: 'disabled' };
  }

  const definition = features[featureName];
  if (definition === undefined) {
    return { enabled: false, reason: 'disabled' };
  }

  // Simple boolean flag
  if (typeof definition === 'boolean') {
    return { enabled: definition, reason: 'static' };
  }

  const def = definition as FeatureDefinition;

  // Explicit disabled
  if (def.enabled === false) {
    return { enabled: false, reason: 'static' };
  }

  // Environment check
  if (def.allowedEnvironments && def.allowedEnvironments.length > 0 && environment) {
    if (!def.allowedEnvironments.includes(environment.name)) {
      return { enabled: false, reason: 'environment' };
    }
  }

  // Role check
  if (def.allowedRoles && def.allowedRoles.length > 0) {
    const hasAllowedRole = user.roles.some((role) =>
      (def.allowedRoles as readonly string[]).includes(role as string),
    );
    if (!hasAllowedRole) {
      return { enabled: false, reason: 'role' };
    }
  }

  // Plan check
  if (def.allowedPlans && def.allowedPlans.length > 0) {
    if (!user.plan || !def.allowedPlans.includes(user.plan as string)) {
      return { enabled: false, reason: 'plan' };
    }
  }

  // Dependency check
  if (def.dependencies && def.dependencies.length > 0 && resolvedFeatures) {
    const allDepsEnabled = def.dependencies.every((dep) => resolvedFeatures.get(dep) === true);
    if (!allDepsEnabled) {
      return { enabled: false, reason: 'dependency' };
    }
  }

  // Percentage rollout (deterministic by user ID + feature name)
  if (def.rolloutPercentage !== undefined && def.rolloutPercentage < 100) {
    const hash = hashUserId(user.id, featureName as string);
    const bucket = hash % 100;
    if (bucket >= def.rolloutPercentage) {
      return { enabled: false, reason: 'rollout' };
    }
    return { enabled: true, reason: 'rollout' };
  }

  // Default: enabled if definition exists and nothing blocked it
  return { enabled: true, reason: 'static' };
}

/**
 * Evaluate all features at once, resolving dependencies in topological order.
 */
export function evaluateAllFeatures<
  TRole extends string,
  TFeature extends string,
  TPlan extends string,
>(
  user: UserContext<TRole, TPlan>,
  config: Pick<AccessConfig<TRole, string, TFeature, TPlan>, 'features'>,
  environment?: EnvironmentContext,
): Map<TFeature, FeatureEvalResult> {
  const results = new Map<TFeature, FeatureEvalResult>();
  const resolvedFlags = new Map<string, boolean>();

  if (!config.features) return results;

  const featureNames = Object.keys(config.features) as TFeature[];

  // Simple topological resolution — evaluate features with no dependencies first,
  // then features whose dependencies are all resolved
  const pending = new Set(featureNames);
  let progress = true;

  while (pending.size > 0 && progress) {
    progress = false;
    for (const name of pending) {
      const def = config.features[name];
      const deps =
        typeof def === 'object' && def !== null && 'dependencies' in def
          ? (def as FeatureDefinition).dependencies
          : undefined;

      const depsResolved = !deps || deps.every((d) => resolvedFlags.has(d));

      if (depsResolved) {
        const result = evaluateFeature(name, user, config, environment, resolvedFlags);
        results.set(name, result);
        resolvedFlags.set(name as string, result.enabled);
        pending.delete(name);
        progress = true;
      }
    }
  }

  // Any remaining features have circular dependencies — mark disabled
  for (const name of pending) {
    results.set(name, { enabled: false, reason: 'dependency' });
  }

  return results;
}
