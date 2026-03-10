// ---------------------------------------------------------------------------
// Devtools data model
// ---------------------------------------------------------------------------
// Structured event entries used by the devtools UI.
// ---------------------------------------------------------------------------

/** Unified log entry for any access-related event */
export interface DevtoolsLogEntry {
  id: string;
  type: 'access-check' | 'feature-eval' | 'policy-eval' | 'experiment-assign' | 'render-denied';
  timestamp: number;
  /** Which component triggered this (if labelled) */
  componentLabel?: string;
  /** The raw event payload */
  data: Record<string, unknown>;
  /** Quick-access summary fields */
  summary: {
    key: string; // permission name, feature name, etc.
    result: string; // 'granted' | 'denied' | 'enabled' | 'disabled' | variant name
    reason?: string;
    reasonCode?: string;
  };
}

/** Position of the devtools panel */
export type DevtoolsPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

/** Which tab is active */
export type DevtoolsTab = 'overview' | 'access' | 'features' | 'policies' | 'experiments' | 'log';

/** Full snapshot of the access state for the overview */
export interface DevtoolsSnapshot {
  userId: string;
  roles: readonly string[];
  permissions: readonly string[];
  plan?: string;
  attributes?: Record<string, unknown>;
  features: Array<{ name: string; enabled: boolean; reason: string; segment?: string }>;
  experiments: Array<{ id: string; variant: string; active: boolean }>;
  roleCount: number;
  permissionCount: number;
  featureCount: number;
  debugEnabled: boolean;
}
