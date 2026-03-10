'use client';

import { useMemo } from 'react';
import { useAccessContext } from './useAccessContext';

export interface UseRoleResult {
  /** All roles the current user holds */
  roles: readonly string[];
  /** Check if user has a specific role */
  hasRole: (role: string) => boolean;
  /** Check if user has any of the specified roles */
  hasAnyRole: (roles: string[]) => boolean;
  /** Check if user has all of the specified roles */
  hasAllRoles: (roles: string[]) => boolean;
}

/**
 * Access the current user's roles with utility checkers.
 *
 * @example
 * ```tsx
 * const { roles, hasRole } = useRole();
 * if (hasRole('admin')) { ... }
 * ```
 */
export function useRole(): UseRoleResult {
  const ctx = useAccessContext();
  const userRoles = ctx.user.roles;

  return useMemo(
    () => ({
      roles: userRoles,
      hasRole: (role: string) => userRoles.includes(role),
      hasAnyRole: (roles: string[]) => roles.some((r) => userRoles.includes(r)),
      hasAllRoles: (roles: string[]) => roles.every((r) => userRoles.includes(r)),
    }),
    [userRoles],
  );
}
