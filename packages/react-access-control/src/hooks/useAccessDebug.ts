'use client';

import { useMemo } from 'react';
import { useAccessContext } from './useAccessContext';
import type { AccessDebugInfo } from '../types';

/**
 * Access debug metadata for access decisions.
 * Only useful when `debug: true` is set in the config.
 *
 * @example
 * ```tsx
 * const { lastChecks, lastFeatureEvals, configSnapshot } = useAccessDebug();
 * ```
 */
export function useAccessDebug(): AccessDebugInfo {
  const ctx = useAccessContext();
  return useMemo(() => ctx.getDebugInfo(), [ctx.getDebugInfo]);
}
