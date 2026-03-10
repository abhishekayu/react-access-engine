'use client';

import { useMemo, useCallback } from 'react';
import { useAccessContext } from './useAccessContext';
import { hasPlanAccess } from '../engines/plan-engine';

/**
 * Primary hook for accessing the full access control context.
 *
 * Provides both the full context API (checkPermission, checkFeature, etc.)
 * and simple shorthand methods for the most common checks:
 *
 * @example
 * ```tsx
 * const { can, is, has, tier } = useAccess();
 *
 * can('articles:edit')              // check permission
 * can('articles:edit', { ownerId }) // with resource
 * is('admin')                       // check role
 * has('dark-mode')                  // check feature flag
 * tier('pro')                       // check plan tier
 * ```
 */
export function useAccess() {
  const ctx = useAccessContext();

  const can = useCallback(
    (permission: string, resource?: Record<string, unknown>) =>
      ctx.checkPermission(permission, resource),
    [ctx.checkPermission],
  );

  const is = useCallback((role: string) => ctx.user.roles.includes(role), [ctx.user.roles]);

  const has = useCallback(
    (feature: string) => ctx.checkFeature(feature).enabled,
    [ctx.checkFeature],
  );

  const tier = useCallback(
    (plan: string) => hasPlanAccess(ctx.user, plan, ctx.config),
    [ctx.user, ctx.config],
  );

  return useMemo(
    () => ({
      // Simple shorthand methods
      can,
      is,
      has,
      tier,
      // Full context (backward compat)
      user: ctx.user,
      config: ctx.config,
      roles: ctx.user.roles,
      permissions: ctx.userPermissions,
      checkPermission: ctx.checkPermission,
      checkFeature: ctx.checkFeature,
      getExperiment: ctx.getExperiment,
    }),
    [
      can,
      is,
      has,
      tier,
      ctx.user,
      ctx.config,
      ctx.userPermissions,
      ctx.checkPermission,
      ctx.checkFeature,
      ctx.getExperiment,
    ],
  );
}
