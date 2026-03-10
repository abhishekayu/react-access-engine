'use client';

import { useMemo } from 'react';
import { useAccessContext } from './useAccessContext';

/**
 * Check if the current user has a specific permission.
 *
 * @example
 * ```tsx
 * const canEdit = usePermission('articles:edit');
 * const canDelete = usePermission('articles:delete', { ownerId: article.ownerId });
 * ```
 */
export function usePermission(permission: string, resource?: Record<string, unknown>): boolean {
  const ctx = useAccessContext();
  // Memoize on permission + resource identity
  return useMemo(
    () => ctx.checkPermission(permission, resource),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ctx.checkPermission, permission, JSON.stringify(resource)],
  );
}
