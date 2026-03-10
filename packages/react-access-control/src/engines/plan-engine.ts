import type { AccessConfig, UserContext } from '../types';

// ---------------------------------------------------------------------------
// Plan Engine
// ---------------------------------------------------------------------------
// Evaluates subscription/plan-based access.
// Supports plan hierarchy (plans ordered from lowest to highest tier).
// ---------------------------------------------------------------------------

/**
 * Check if a user's plan meets or exceeds the required plan tier.
 * Plans are ordered from lowest to highest in the config.plans array.
 */
export function hasPlanAccess<TPlan extends string>(
  user: UserContext<string, TPlan>,
  requiredPlan: TPlan,
  config: Pick<AccessConfig<string, string, string, TPlan>, 'plans'>,
): boolean {
  const plans = config.plans;
  if (!plans || plans.length === 0) return true; // No plan hierarchy defined = no restriction

  if (!user.plan) return false;

  const userPlanIndex = plans.indexOf(user.plan);
  const requiredPlanIndex = plans.indexOf(requiredPlan);

  if (userPlanIndex === -1 || requiredPlanIndex === -1) return false;

  return userPlanIndex >= requiredPlanIndex;
}

/**
 * Get the user's current plan tier index (0-based, -1 if not found).
 */
export function getPlanTier<TPlan extends string>(
  user: UserContext<string, TPlan>,
  config: Pick<AccessConfig<string, string, string, TPlan>, 'plans'>,
): number {
  if (!config.plans || !user.plan) return -1;
  return config.plans.indexOf(user.plan);
}
