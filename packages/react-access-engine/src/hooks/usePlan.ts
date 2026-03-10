'use client';

import { useMemo } from 'react';
import { useAccessContext } from './useAccessContext';
import { hasPlanAccess } from '../engines/plan-engine';

export interface UsePlanResult {
  /** Current user's plan */
  plan: string | undefined;
  /** Check if user's plan meets or exceeds the required plan */
  hasPlanAccess: (requiredPlan: string) => boolean;
}

/**
 * Access the current user's subscription plan with tier comparison.
 *
 * @example
 * ```tsx
 * const { plan, hasPlanAccess } = usePlan();
 * if (hasPlanAccess('pro')) { ... }
 * ```
 */
export function usePlan(): UsePlanResult {
  const ctx = useAccessContext();

  return useMemo(
    () => ({
      plan: ctx.user.plan,
      hasPlanAccess: (requiredPlan: string) => hasPlanAccess(ctx.user, requiredPlan, ctx.config),
    }),
    [ctx.user, ctx.config],
  );
}
