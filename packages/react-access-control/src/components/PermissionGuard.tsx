'use client';

import React, { useMemo } from 'react';
import { useAccessContext } from '../hooks/useAccessContext';

export interface PermissionGuardProps {
  /** Required permissions — user must have ALL */
  permissions: string[];
  /** Resource for ABAC conditions */
  resource?: Record<string, unknown>;
  /** Content to render when authorized */
  children: React.ReactNode;
  /** Content to render when unauthorized (e.g., redirect or 403 page) */
  fallback?: React.ReactNode;
}

/**
 * Route-level permission guard. Use this to protect entire pages/routes.
 * Requires ALL specified permissions to pass.
 *
 * @example
 * ```tsx
 * <PermissionGuard
 *   permissions={['admin:access', 'users:manage']}
 *   fallback={<NotAuthorized />}
 * >
 *   <AdminPage />
 * </PermissionGuard>
 * ```
 */
export function PermissionGuard({
  permissions,
  resource,
  children,
  fallback = null,
}: PermissionGuardProps): React.ReactElement | null {
  const ctx = useAccessContext();

  // Use context's checkPermission directly to avoid calling hooks in a loop
  // (which would violate React's Rules of Hooks)
  const allGranted = useMemo(
    () => permissions.every((perm) => ctx.checkPermission(perm, resource)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ctx.checkPermission, permissions.join('\0'), JSON.stringify(resource)],
  );

  return React.createElement(React.Fragment, null, allGranted ? children : fallback);
}
