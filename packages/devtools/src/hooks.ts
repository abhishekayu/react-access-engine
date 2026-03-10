'use client';

import { useContext, useSyncExternalStore, useCallback, useRef } from 'react';
import { AccessContext } from 'react-access-control';
import type { AccessContextValue } from 'react-access-control';
import type {
  DebugEvent,
  AccessCheckEvent,
  FeatureEvaluateEvent,
  PolicyEvaluateEvent,
} from 'react-access-control';
import type { DevtoolsLogEntry, DevtoolsSnapshot } from './types';

// ---------------------------------------------------------------------------
// useDevtoolsContext — safely reads the AccessContext
// ---------------------------------------------------------------------------

export function useDevtoolsContext(): AccessContextValue | null {
  return useContext(AccessContext);
}

// ---------------------------------------------------------------------------
// useDebugSubscription — live event stream from the debug engine
// ---------------------------------------------------------------------------

let entryCounter = 0;
function nextId(): string {
  return `dt-${++entryCounter}-${Date.now()}`;
}

function eventToLogEntry(event: DebugEvent): DevtoolsLogEntry | null {
  if (!event.payload) return null;

  const payload = event.payload;
  const timestamp =
    payload != null && typeof payload === 'object' && 'timestamp' in payload
      ? (payload.timestamp as number)
      : Date.now();

  switch (event.type) {
    case 'access-check': {
      const e = payload as AccessCheckEvent;
      return {
        id: nextId(),
        type: 'access-check',
        timestamp,
        data: { ...e },
        summary: {
          key: e.permission,
          result: e.granted ? 'granted' : 'denied',
          reason: e.reason,
          reasonCode: e.reasonCode,
        },
      };
    }
    case 'feature-eval': {
      const e = payload as FeatureEvaluateEvent;
      return {
        id: nextId(),
        type: 'feature-eval',
        timestamp,
        data: { ...e },
        summary: {
          key: e.feature,
          result: e.enabled ? 'enabled' : 'disabled',
          reason: e.reason,
          reasonCode: e.segment,
        },
      };
    }
    case 'policy-eval': {
      const e = payload as PolicyEvaluateEvent;
      return {
        id: nextId(),
        type: 'policy-eval',
        timestamp,
        data: { ...e },
        summary: {
          key: e.permission,
          result: e.effect,
          reason: e.matchedRule ?? 'no-match',
          reasonCode: e.reasonCode,
        },
      };
    }
    default:
      return null;
  }
}

const MAX_LOG = 200;

interface LogStore {
  entries: DevtoolsLogEntry[];
  version: number;
}

/**
 * Subscribe to the core debug engine and accumulate structured log entries.
 * Uses `useSyncExternalStore` for tear-free reads.
 */
export function useDebugLog(ctx: AccessContextValue | null): {
  entries: DevtoolsLogEntry[];
  clear: () => void;
} {
  const storeRef = useRef<LogStore>({ entries: [], version: 0 });
  const listenersRef = useRef(new Set<() => void>());

  // Subscribe to debug engine events
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      listenersRef.current.add(onStoreChange);

      let unsub: (() => void) | undefined;
      if (ctx?.debugEngine) {
        unsub = ctx.debugEngine.subscribe((event: DebugEvent) => {
          const entry = eventToLogEntry(event);
          if (entry) {
            const store = storeRef.current;
            const next = [...store.entries, entry];
            if (next.length > MAX_LOG) next.splice(0, next.length - MAX_LOG);
            storeRef.current = { entries: next, version: store.version + 1 };
            for (const l of listenersRef.current) l();
          }
          if (event.type === 'clear') {
            storeRef.current = { entries: [], version: storeRef.current.version + 1 };
            for (const l of listenersRef.current) l();
          }
        });
      }

      return () => {
        listenersRef.current.delete(onStoreChange);
        unsub?.();
      };
    },
    [ctx?.debugEngine],
  );

  const getSnapshot = useCallback(() => storeRef.current, []);

  const store = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const clear = useCallback(() => {
    ctx?.debugEngine?.clear();
    storeRef.current = { entries: [], version: storeRef.current.version + 1 };
    for (const l of listenersRef.current) l();
  }, [ctx?.debugEngine]);

  return { entries: store.entries, clear };
}

// ---------------------------------------------------------------------------
// useDevtoolsSnapshot — current state overview
// ---------------------------------------------------------------------------

export function useDevtoolsSnapshot(ctx: AccessContextValue | null): DevtoolsSnapshot | null {
  if (!ctx) return null;

  const features: DevtoolsSnapshot['features'] = [];
  ctx.featureResults.forEach((result, name) => {
    features.push({
      name,
      enabled: result.enabled,
      reason: result.reason,
    });
  });

  const experiments: DevtoolsSnapshot['experiments'] = [];
  if (ctx.config.experiments) {
    for (const expId of Object.keys(ctx.config.experiments)) {
      const assignment = ctx.getExperiment(expId);
      experiments.push({
        id: assignment.experimentId,
        variant: assignment.variant,
        active: assignment.active,
      });
    }
  }

  return {
    userId: ctx.user.id,
    roles: ctx.user.roles,
    permissions: ctx.userPermissions,
    plan: ctx.user.plan,
    attributes: ctx.user.attributes,
    features,
    experiments,
    roleCount: ctx.user.roles.length,
    permissionCount: ctx.userPermissions.length,
    featureCount: features.length,
    debugEnabled: ctx.config.debug ?? false,
  };
}
