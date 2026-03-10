'use client';

import React from 'react';
import { useFeature } from '../hooks/useFeature';

export interface FeatureToggleProps {
  /** Feature flag name */
  name: string;
  /** Render prop receiving the feature state */
  children: (state: { enabled: boolean; reason: string }) => React.ReactNode;
}

/**
 * Render-prop component for feature flags. Use this when you need
 * the feature state value (not just conditional rendering).
 *
 * @example
 * ```tsx
 * <FeatureToggle name="new-pricing">
 *   {({ enabled }) => (
 *     <PricingPage variant={enabled ? 'new' : 'legacy'} />
 *   )}
 * </FeatureToggle>
 * ```
 */
export function FeatureToggle({ name, children }: FeatureToggleProps): React.ReactElement | null {
  const state = useFeature(name);
  return React.createElement(React.Fragment, null, children(state));
}
