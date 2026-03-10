import type { AccessConfig, UserContext } from '../types';

// ---------------------------------------------------------------------------
// Role Engine
// ---------------------------------------------------------------------------
// Pure functions for role-based access checks.
// Supports multi-role users and wildcard roles.
// ---------------------------------------------------------------------------

/**
 * Check if a user has a specific role.
 */
export function hasRole<TRole extends string>(user: UserContext<TRole>, role: TRole): boolean {
  return user.roles.includes(role);
}

/**
 * Check if a user has ANY of the specified roles.
 */
export function hasAnyRole<TRole extends string>(
  user: UserContext<TRole>,
  roles: readonly TRole[],
): boolean {
  return roles.some((role) => user.roles.includes(role));
}

/**
 * Check if a user has ALL of the specified roles.
 */
export function hasAllRoles<TRole extends string>(
  user: UserContext<TRole>,
  roles: readonly TRole[],
): boolean {
  return roles.every((role) => user.roles.includes(role));
}

/**
 * Get all permissions for a user based on their roles.
 * Merges permissions from all roles the user holds.
 */
export function getPermissionsForUser<TRole extends string, TPermission extends string>(
  user: UserContext<TRole>,
  config: Pick<AccessConfig<TRole, TPermission>, 'permissions'>,
): readonly TPermission[] {
  const permissionSet = new Set<TPermission>();

  for (const role of user.roles) {
    const rolePermissions = config.permissions[role];
    if (rolePermissions) {
      for (const perm of rolePermissions) {
        permissionSet.add(perm);
      }
    }
  }

  return Array.from(permissionSet);
}
