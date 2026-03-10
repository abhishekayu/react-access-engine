'use client';

import React from 'react';
import { usePermission } from '../hooks/usePermission';
import { useFeature } from '../hooks/useFeature';
import { usePlan } from '../hooks/usePlan';
import { useRole } from '../hooks/useRole';

export interface AccessGateProps {
  /** Required permission (optional) */
  permission?: string;
  /** Required feature flag (optional) */
  feature?: string;
  /** Required role — user must have at least one (optional) */
  roles?: string[];
  /** Required minimum plan tier (optional) */
  plan?: string;
  /** Resource for ABAC conditions */
  resource?: Record<string, unknown>;
  /** All conditions must pass (default) or any condition */
  mode?: 'all' | 'any';
  /** Content to render when all conditions pass */
  children: React.ReactNode;
  /** Content to render when conditions fail */
  fallback?: React.ReactNode;
}

/**
 * Multi-condition access gate. Combines permission, feature,
 * role, and plan checks in a single declarative component.
 *
 * @example
 * ```tsx
 * <AccessGate
 *   permission="analytics:view"
 *   feature="analytics-v2"
 *   plan="pro"
 *   fallback={<UpgradePrompt />}
 * >
 *   <AnalyticsDashboard />
 * </AccessGate>
 * ```
 */
export function AccessGate({
  permission,
  feature,
  roles,
  plan,
  resource,
  mode = 'all',
  children,
  fallback = null,
}: AccessGateProps): React.ReactElement | null {
  const permissionGranted = usePermission(permission ?? '', resource);
  const { enabled: featureEnabled } = useFeature(feature ?? '');
  const { hasPlanAccess } = usePlan();
  const { hasAnyRole } = useRole();

  const checks: boolean[] = [];

  if (permission) checks.push(permissionGranted);
  if (feature) checks.push(featureEnabled);
  if (roles && roles.length > 0) checks.push(hasAnyRole(roles));
  if (plan) checks.push(hasPlanAccess(plan));

  // If no conditions specified, allow access
  const passed =
    checks.length === 0 ? true : mode === 'all' ? checks.every(Boolean) : checks.some(Boolean);

  return React.createElement(React.Fragment, null, passed ? children : fallback);
}
