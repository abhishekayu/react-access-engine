'use client';

import { useMemo } from 'react';
import { useAccessContext } from './useAccessContext';
import type { ExperimentAssignment } from '../engines/experiment-engine';

/**
 * Get the user's experiment assignment for a given experiment.
 *
 * @example
 * ```tsx
 * const { variant, active } = useExperiment('checkout-redesign');
 * if (variant === 'variant-b') { ... }
 * ```
 */
export function useExperiment(experimentId: string): ExperimentAssignment {
  const ctx = useAccessContext();

  return useMemo(() => ctx.getExperiment(experimentId), [ctx.getExperiment, experimentId]);
}
