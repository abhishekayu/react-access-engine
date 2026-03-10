import type {
  AccessCheckEvent,
  FeatureEvaluateEvent,
  PolicyEvaluateEvent,
  AccessConfig,
  AccessDebugInfo,
} from '../types';

// ---------------------------------------------------------------------------
// Debug Engine
// ---------------------------------------------------------------------------
// Collects debug metadata for access decisions.
// Only active when config.debug is true.
// Supports listeners for real-time devtools subscriptions.
// ---------------------------------------------------------------------------

const MAX_ENTRIES = 100;

export type DebugEventType = 'access-check' | 'feature-eval' | 'policy-eval' | 'clear';

export interface DebugEvent {
  type: DebugEventType;
  payload: AccessCheckEvent | FeatureEvaluateEvent | PolicyEvaluateEvent | null;
}

export type DebugListener = (event: DebugEvent) => void;

export class DebugEngine {
  private _accessChecks: AccessCheckEvent[] = [];
  private _featureEvals: FeatureEvaluateEvent[] = [];
  private _policyEvals: PolicyEvaluateEvent[] = [];
  private _config: AccessConfig | null = null;
  private _listeners: Set<DebugListener> = new Set();

  setConfig(config: AccessConfig): void {
    this._config = config;
  }

  /** Subscribe to debug events. Returns an unsubscribe function. */
  subscribe(listener: DebugListener): () => void {
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  }

  private _emit(event: DebugEvent): void {
    for (const listener of this._listeners) {
      try {
        listener(event);
      } catch {
        /* listener errors must not break the app */
      }
    }
  }

  recordAccessCheck(event: AccessCheckEvent): void {
    this._accessChecks.push(event);
    if (this._accessChecks.length > MAX_ENTRIES) {
      this._accessChecks = this._accessChecks.slice(-MAX_ENTRIES);
    }
    this._emit({ type: 'access-check', payload: event });
  }

  recordFeatureEval(event: FeatureEvaluateEvent): void {
    this._featureEvals.push(event);
    if (this._featureEvals.length > MAX_ENTRIES) {
      this._featureEvals = this._featureEvals.slice(-MAX_ENTRIES);
    }
    this._emit({ type: 'feature-eval', payload: event });
  }

  recordPolicyEval(event: PolicyEvaluateEvent): void {
    this._policyEvals.push(event);
    if (this._policyEvals.length > MAX_ENTRIES) {
      this._policyEvals = this._policyEvals.slice(-MAX_ENTRIES);
    }
    this._emit({ type: 'policy-eval', payload: event });
  }

  getDebugInfo(): AccessDebugInfo {
    return {
      lastChecks: [...this._accessChecks],
      lastFeatureEvals: [...this._featureEvals],
      lastPolicyEvals: [...this._policyEvals],
      configSnapshot: this._config ?? { roles: [], permissions: {} },
      timestamp: Date.now(),
    };
  }

  clear(): void {
    this._accessChecks = [];
    this._featureEvals = [];
    this._policyEvals = [];
    this._emit({ type: 'clear', payload: null });
  }
}
