'use client';

import { useMemo } from 'react';
import { useAccessContext } from './useAccessContext';

/**
 * Primary hook for accessing the full access control context.
 *
 * @example
 * ```tsx
 * const { user, config, checkPermission, checkFeature } = useAccess();
 * ```
 */
export function useAccess() {
  const ctx = useAccessContext();

  return useMemo(
    () => ({
      user: ctx.user,
      config: ctx.config,
      roles: ctx.user.roles,
      permissions: ctx.userPermissions,
      checkPermission: ctx.checkPermission,
      checkFeature: ctx.checkFeature,
      getExperiment: ctx.getExperiment,
    }),
    [
      ctx.user,
      ctx.config,
      ctx.userPermissions,
      ctx.checkPermission,
      ctx.checkFeature,
      ctx.getExperiment,
    ],
  );
}
