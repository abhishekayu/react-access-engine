'use client';

import { createContext } from 'react';
import type { AccessConfig, UserContext, AccessDebugInfo } from './types';
import type { FeatureEvalResult } from './engines/feature-engine';
import type { ExperimentAssignment } from './engines/experiment-engine';
import type { PluginEngine } from './engines/plugin-engine';
import type { DebugEngine } from './engines/debug-engine';

// ---------------------------------------------------------------------------
// Internal context value — not exposed to consumers directly
// ---------------------------------------------------------------------------
export interface AccessContextValue {
  config: AccessConfig;
  user: UserContext;
  // Computed caches (set by provider)
  userPermissions: readonly string[];
  featureResults: ReadonlyMap<string, FeatureEvalResult>;
  // Engines
  pluginEngine: PluginEngine;
  debugEngine: DebugEngine;
  // Methods exposed via hooks
  checkPermission: (permission: string, resource?: Record<string, unknown>) => boolean;
  checkFeature: (feature: string) => FeatureEvalResult;
  getExperiment: (experimentId: string) => ExperimentAssignment;
  getDebugInfo: () => AccessDebugInfo;
}

export const AccessContext = createContext<AccessContextValue | null>(null);
AccessContext.displayName = 'AccessContext';
