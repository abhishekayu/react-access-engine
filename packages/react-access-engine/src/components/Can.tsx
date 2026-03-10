'use client';

import React from 'react';
import { useAccessContext } from '../hooks/useAccessContext';

export interface CanProps {
  /**
   * Single permission to check (e.g., `"articles:edit"`).
   * Alias: `permission`.
   */
  perform?: string;

  /** Single permission to check (alias for `perform`). */
  permission?: string;

  /** Multiple permissions to check. Combined with `mode`. */
  permissions?: string[];

  /** Resource attributes for ABAC condition evaluation. */
  on?: Record<string, unknown>;

  /** Single role to check. */
  role?: string;

  /** Multiple roles to check. Combined with `mode`. */
  roles?: string[];

  /** Permission to evaluate against the policy engine. */
  policy?: string;

  /**
   * Match mode when multiple checks are provided.
   * - `"all"` (default) — every check must pass.
   * - `"any"` — at least one check must pass.
   */
  mode?: 'all' | 'any';

  /** Content rendered when all checks pass. */
  children: React.ReactNode;

  /** Content rendered when checks fail. */
  fallback?: React.ReactNode;
}

/**
 * Declarative access gate supporting roles, permissions, policies,
 * and any/all matching.
 *
 * @example
 * ```tsx
 * // Single permission
 * <Can perform="articles:edit" fallback={<ReadOnly />}>
 *   <Editor />
 * </Can>
 *
 * // Role + permission
 * <Can role="admin" permission="users:delete">
 *   <DeleteButton />
 * </Can>
 *
 * // Multiple permissions, any match
 * <Can permissions={["billing:read", "billing:manage"]} mode="any">
 *   <BillingSection />
 * </Can>
 * ```
 */
export function Can({
  perform,
  permission,
  permissions,
  on,
  role,
  roles,
  policy,
  mode = 'all',
  children,
  fallback = null,
}: CanProps): React.ReactElement | null {
  const ctx = useAccessContext();

  // Collect all individual check results
  const checks: boolean[] = [];

  // Permission checks (perform / permission / permissions)
  const singlePerm = perform ?? permission;
  if (singlePerm) {
    checks.push(ctx.checkPermission(singlePerm, on));
  }
  if (permissions) {
    for (const p of permissions) {
      checks.push(ctx.checkPermission(p, on));
    }
  }

  // Role checks
  if (role) {
    checks.push(ctx.user.roles.includes(role));
  }
  if (roles) {
    // In 'all' mode each role must be present; in 'any' at least one
    if (mode === 'all') {
      for (const r of roles) {
        checks.push(ctx.user.roles.includes(r));
      }
    } else {
      checks.push(roles.some((r) => ctx.user.roles.includes(r)));
    }
  }

  // Policy check
  if (policy) {
    checks.push(ctx.checkPermission(policy, on));
  }

  // If no checks were specified, always grant (avoid false negatives)
  const passed =
    checks.length === 0 ? true : mode === 'all' ? checks.every(Boolean) : checks.some(Boolean);

  return React.createElement(React.Fragment, null, passed ? children : fallback);
}
