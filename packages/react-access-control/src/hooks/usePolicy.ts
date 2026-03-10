'use client';

import { useMemo } from 'react';
import { useAccessContext } from './useAccessContext';
import { evaluatePolicy } from '../engines/policy-engine';

export interface UsePolicyResult {
  /** Whether the policy allows the action */
  allowed: boolean;
  /** The ID of the rule that matched, if any */
  matchedRule: string | null;
  /** Human-readable reason */
  reason: string;
}

/**
 * Evaluate a policy for a specific permission and optional resource.
 *
 * @example
 * ```tsx
 * const { allowed, reason } = usePolicy('articles:delete', { ownerId: article.ownerId });
 * ```
 */
export function usePolicy(permission: string, resource?: Record<string, unknown>): UsePolicyResult {
  const ctx = useAccessContext();

  return useMemo(() => {
    const result = evaluatePolicy(permission, ctx.user, ctx.config, {
      resource,
      environment: ctx.config.environment,
    });
    return {
      allowed: result.effect === 'allow',
      matchedRule: result.matchedRule,
      reason: result.reason,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permission, JSON.stringify(resource), ctx.user, ctx.config]);
}
