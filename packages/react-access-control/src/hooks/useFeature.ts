'use client';

import { useMemo } from 'react';
import { useAccessContext } from './useAccessContext';
import type { FeatureEvalResult } from '../engines/feature-engine';

export interface UseFeatureResult {
  /** Whether the feature is enabled */
  enabled: boolean;
  /** Reason for the evaluation result */
  reason: FeatureEvalResult['reason'];
}

/**
 * Check if a feature flag is enabled for the current user.
 *
 * @example
 * ```tsx
 * const { enabled } = useFeature('dark-mode');
 * const { enabled, reason } = useFeature('new-editor');
 * ```
 */
export function useFeature(featureName: string): UseFeatureResult {
  const ctx = useAccessContext();

  return useMemo(() => {
    const result = ctx.checkFeature(featureName);
    return { enabled: result.enabled, reason: result.reason };
  }, [ctx.checkFeature, featureName]);
}
