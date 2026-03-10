'use client';

import React from 'react';
import { useFeature } from '../hooks/useFeature';

export interface FeatureProps {
  /** Feature flag name */
  name: string;
  /** Content to render when the feature is enabled */
  children: React.ReactNode;
  /** Content to render when the feature is disabled */
  fallback?: React.ReactNode;
}

/**
 * Declarative feature flag gate. Renders children only if the
 * named feature is enabled for the current user.
 *
 * @example
 * ```tsx
 * <Feature name="new-editor" fallback={<LegacyEditor />}>
 *   <NewEditor />
 * </Feature>
 * ```
 */
export function Feature({
  name,
  children,
  fallback = null,
}: FeatureProps): React.ReactElement | null {
  const { enabled } = useFeature(name);
  return React.createElement(React.Fragment, null, enabled ? children : fallback);
}
