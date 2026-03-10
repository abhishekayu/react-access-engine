'use client';

import React from 'react';
import { useAccessContext } from '../hooks/useAccessContext';
import { hasPlanAccess } from '../engines/plan-engine';

export interface AllowProps {
  /** Permission to check (e.g., `"articles:edit"`). */
  permission?: string;
  /** Multiple permissions. Combined with `match`. */
  permissions?: string[];
  /** Resource attributes for ABAC condition evaluation. */
  on?: Record<string, unknown>;
  /** Role to check. */
  role?: string;
  /** Multiple roles — user must have at least one. */
  roles?: string[];
  /** Feature flag name to check. */
  feature?: string;
  /** Minimum plan tier to check. */
  plan?: string;
  /**
   * Match mode when multiple conditions are provided.
   * - `"all"` (default) — every condition must pass.
   * - `"any"` — at least one condition must pass.
   */
  match?: 'all' | 'any';
  /** Content rendered when conditions pass. */
  children: React.ReactNode;
  /** Content rendered when conditions fail. */
  fallback?: React.ReactNode;
}

/**
 * Unified access gate. One component for permissions, roles,
 * features, and plan checks — alone or combined.
 *
 * @example
 * ```tsx
 * // Single permission
 * <Allow permission="articles:edit">
 *   <Editor />
 * </Allow>
 *
 * // Role + feature + plan (all must pass)
 * <Allow role="editor" feature="new-editor" plan="pro" fallback={<Upgrade />}>
 *   <ProEditor />
 * </Allow>
 *
 * // Any condition
 * <Allow role="admin" permission="billing:view" match="any">
 *   <BillingSection />
 * </Allow>
 * ```
 */
export function Allow({
  permission,
  permissions,
  on,
  role,
  roles,
  feature,
  plan,
  match = 'all',
  children,
  fallback = null,
}: AllowProps): React.ReactElement | null {
  const ctx = useAccessContext();

  const checks: boolean[] = [];

  if (permission) {
    checks.push(ctx.checkPermission(permission, on));
  }
  if (permissions && permissions.length > 0) {
    const results = permissions.map((p) => ctx.checkPermission(p, on));
    checks.push(match === 'all' ? results.every(Boolean) : results.some(Boolean));
  }
  if (role) {
    checks.push(ctx.user.roles.includes(role));
  }
  if (roles && roles.length > 0) {
    checks.push(roles.some((r) => ctx.user.roles.includes(r)));
  }
  if (feature) {
    checks.push(ctx.checkFeature(feature).enabled);
  }
  if (plan) {
    checks.push(hasPlanAccess(ctx.user, plan, ctx.config));
  }

  const passed =
    checks.length === 0 ? true : match === 'all' ? checks.every(Boolean) : checks.some(Boolean);

  return React.createElement(React.Fragment, null, passed ? children : fallback);
}
