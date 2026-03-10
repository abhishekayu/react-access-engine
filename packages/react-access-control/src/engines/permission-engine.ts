import type { AccessConfig, UserContext } from '../types';
import { getPermissionsForUser } from './role-engine';

// ---------------------------------------------------------------------------
// Permission Engine
// ---------------------------------------------------------------------------
// Evaluates whether a user has a specific permission.
// Supports wildcard permissions ('*') and namespace wildcards ('articles:*').
// ---------------------------------------------------------------------------

/**
 * Check if a permission string matches a pattern.
 * Supports '*' (all) and 'namespace:*' (namespace wildcard).
 */
function permissionMatches(held: string, required: string): boolean {
  if (held === '*') return true;
  if (held === required) return true;

  // Namespace wildcard: 'articles:*' matches 'articles:read', 'articles:write', etc.
  if (held.endsWith(':*')) {
    const namespace = held.slice(0, -2);
    return required.startsWith(namespace + ':');
  }

  return false;
}

/**
 * Check if a user has a specific permission.
 */
export function hasPermission<TRole extends string, TPermission extends string>(
  user: UserContext<TRole>,
  permission: TPermission,
  config: Pick<AccessConfig<TRole, TPermission>, 'permissions'>,
): boolean {
  const userPermissions = getPermissionsForUser(user, config);
  return userPermissions.some((held) => permissionMatches(held as string, permission as string));
}

/**
 * Check if a user has ANY of the specified permissions.
 */
export function hasAnyPermission<TRole extends string, TPermission extends string>(
  user: UserContext<TRole>,
  permissions: readonly TPermission[],
  config: Pick<AccessConfig<TRole, TPermission>, 'permissions'>,
): boolean {
  return permissions.some((perm) => hasPermission(user, perm, config));
}

/**
 * Check if a user has ALL of the specified permissions.
 */
export function hasAllPermissions<TRole extends string, TPermission extends string>(
  user: UserContext<TRole>,
  permissions: readonly TPermission[],
  config: Pick<AccessConfig<TRole, TPermission>, 'permissions'>,
): boolean {
  return permissions.every((perm) => hasPermission(user, perm, config));
}
