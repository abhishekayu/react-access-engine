import type { AccessConfig, EnvironmentContext, PolicyRule, UserContext } from '../types';

// ---------------------------------------------------------------------------
// Policy Engine
// ---------------------------------------------------------------------------
// Evaluates composable allow/deny policy rules.
// Rules are evaluated in priority order (highest first).
// Supports ABAC conditions, role/plan/environment matching.
// Default behavior: deny-by-default (must have explicit allow).
// ---------------------------------------------------------------------------

export interface PolicyEvalResult {
  effect: 'allow' | 'deny';
  matchedRule: string | null;
  reason: string;
}

/**
 * Evaluate a single policy rule against the current context.
 */
function ruleMatches(
  rule: PolicyRule,
  permission: string,
  user: UserContext,
  resource: Record<string, unknown> | undefined,
  environment: EnvironmentContext | undefined,
  context: Record<string, unknown>,
): boolean {
  // Check permission scope
  if (rule.permissions && rule.permissions.length > 0) {
    if (!rule.permissions.includes(permission)) {
      return false;
    }
  }

  // Check role scope
  if (rule.roles && rule.roles.length > 0) {
    const hasMatchingRole = user.roles.some((r) => rule.roles!.includes(r));
    if (!hasMatchingRole) return false;
  }

  // Check plan scope
  if (rule.plans && rule.plans.length > 0) {
    if (!user.plan || !rule.plans.includes(user.plan)) return false;
  }

  // Check environment scope
  if (rule.environments && rule.environments.length > 0) {
    if (!environment || !rule.environments.includes(environment.name)) return false;
  }

  // Check ABAC condition
  if (rule.condition) {
    try {
      return rule.condition({
        user,
        resource: resource ?? {},
        environment: environment ?? { name: 'default' },
        context,
      });
    } catch {
      return false;
    }
  }

  return true;
}

/**
 * Evaluate all policy rules for a given permission check.
 * Returns the final effect (allow/deny) and which rule matched.
 */
export function evaluatePolicy(
  permission: string,
  user: UserContext,
  config: Pick<AccessConfig, 'policies'>,
  options?: {
    resource?: Record<string, unknown>;
    environment?: EnvironmentContext;
    context?: Record<string, unknown>;
  },
): PolicyEvalResult {
  const policies = config.policies;
  if (!policies || policies.length === 0) {
    return { effect: 'allow', matchedRule: null, reason: 'no-policies' };
  }

  // Sort by priority (highest first)
  const sorted = [...policies].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  const resource = options?.resource;
  const environment = options?.environment;
  const context = options?.context ?? {};

  for (const rule of sorted) {
    if (ruleMatches(rule, permission, user, resource, environment, context)) {
      return {
        effect: rule.effect,
        matchedRule: rule.id,
        reason: rule.description ?? `Matched rule: ${rule.id}`,
      };
    }
  }

  // Default deny if policies exist but none matched
  return { effect: 'deny', matchedRule: null, reason: 'no-matching-rule' };
}
