'use client';

import React, { useMemo, useCallback, useRef, useContext } from 'react';
import { AccessContext } from '../context';
import type { AccessConfig, UserContext, AccessProviderProps } from '../types';
import { getPermissionsForUser } from '../engines/role-engine';
import { hasPermission } from '../engines/permission-engine';
import { evaluateAllFeatures, evaluateFeature } from '../engines/feature-engine';
import type { FeatureEvalResult } from '../engines/feature-engine';
import { evaluatePolicy } from '../engines/policy-engine';
import { assignExperiment } from '../engines/experiment-engine';
import type { ExperimentAssignment } from '../engines/experiment-engine';
import { PluginEngine } from '../engines/plugin-engine';
import { DebugEngine } from '../engines/debug-engine';
import { warnOnce } from '../warnings';

// ---------------------------------------------------------------------------
// AccessProvider
// ---------------------------------------------------------------------------
// The root provider that initializes all engines and exposes computed
// access state via React context. Supports nesting — inner providers
// shadow outer ones naturally via React context.
// ---------------------------------------------------------------------------

/**
 * Stable identity ref: returns the same array/object reference when the
 * contents haven't changed, avoiding unnecessary downstream re-renders.
 */
function useStableValue<T>(value: T, isEqual: (a: T, b: T) => boolean): T {
  const ref = useRef(value);
  if (!isEqual(ref.current, value)) {
    ref.current = value;
  }
  return ref.current;
}

function rolesEqual(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function AccessProvider<
  TRole extends string,
  TPermission extends string,
  TFeature extends string,
  TPlan extends string,
  TExperiment extends string,
>({
  config,
  user,
  children,
}: AccessProviderProps<TRole, TPermission, TFeature, TPlan, TExperiment>): React.ReactElement {
  // Dev-only validation
  if (config.roles.length === 0) {
    warnOnce(
      'AccessProvider received an empty `roles` array. Did you forget to define roles in your config?',
    );
  }

  // Detect parent provider (for nesting awareness)
  const parentCtx = useContext(AccessContext);
  if (parentCtx) {
    warnOnce(
      'Nested <AccessProvider> detected. The inner provider fully shadows the outer one. ' +
        'Use mergeConfigs() to compose configs if you need to inherit parent settings.',
    );
  }

  // Cast to base types for internal engine use
  const baseConfig = config as AccessConfig;
  const baseUser = user as UserContext;

  // Stabilise roles identity to avoid spurious recomputation
  const stableRoles = useStableValue(baseUser.roles as readonly string[], rolesEqual);

  // Initialize plugin engine (stable across renders)
  const pluginEngineRef = useRef<PluginEngine | null>(null);
  if (!pluginEngineRef.current) {
    pluginEngineRef.current = new PluginEngine();
  }
  const pluginEngine = pluginEngineRef.current;

  // Re-register plugins when config.plugins changes
  const pluginsRef = useRef(config.plugins);
  if (pluginsRef.current !== config.plugins) {
    pluginsRef.current = config.plugins;
    pluginEngine['plugins'] = []; // reset
    if (config.plugins) {
      pluginEngine.registerAll(config.plugins);
    }
  } else if (pluginEngine['plugins'].length === 0 && config.plugins) {
    pluginEngine.registerAll(config.plugins);
  }

  // Initialize debug engine
  const debugEngineRef = useRef<DebugEngine | null>(null);
  if (!debugEngineRef.current) {
    debugEngineRef.current = new DebugEngine();
  }
  const debugEngine = debugEngineRef.current;

  // Update debug engine config snapshot
  if (config.debug) {
    debugEngine.setConfig(baseConfig);
  }

  // Compute user permissions (memoized on stable roles + config.permissions)
  const userPermissions = useMemo(
    () => getPermissionsForUser(baseUser, baseConfig),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stableRoles, baseConfig.permissions],
  );

  // Compute all feature flag results (memoized)
  const featureResults = useMemo(
    () => evaluateAllFeatures(baseUser, baseConfig, baseConfig.environment),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [baseUser.id, stableRoles, baseUser.plan, baseConfig.features, baseConfig.environment],
  );

  // Permission check with policy integration
  const checkPermission = useCallback(
    (permission: string, resource?: Record<string, unknown>): boolean => {
      // First check basic RBAC permission
      const hasBasicPermission = hasPermission(baseUser, permission, baseConfig);

      // If policies are defined, evaluate them
      let granted = hasBasicPermission;
      let reason = hasBasicPermission ? 'rbac-allow' : 'rbac-deny';

      if (baseConfig.policies && baseConfig.policies.length > 0) {
        const policyResult = evaluatePolicy(permission, baseUser, baseConfig, {
          resource,
          environment: baseConfig.environment,
        });
        // Policy can override RBAC
        if (policyResult.matchedRule) {
          granted = policyResult.effect === 'allow' && hasBasicPermission;
          reason = `policy:${policyResult.matchedRule}`;
        }

        if (config.debug) {
          debugEngine.recordPolicyEval({
            permission,
            effect: policyResult.effect,
            matchedRule: policyResult.matchedRule,
            timestamp: Date.now(),
          });
          pluginEngine.emitPolicyEvaluate({
            permission,
            effect: policyResult.effect,
            matchedRule: policyResult.matchedRule,
            timestamp: Date.now(),
          });
        }
      }

      // Emit events
      const event = {
        permission,
        granted,
        roles: baseUser.roles,
        resource,
        timestamp: Date.now(),
        reason,
      };
      pluginEngine.emitAccessCheck(event);
      if (config.debug) {
        debugEngine.recordAccessCheck(event);
      }

      return granted;
    },
    [baseUser, baseConfig, config.debug, debugEngine, pluginEngine],
  );

  // Feature check
  const checkFeature = useCallback(
    (feature: string): FeatureEvalResult => {
      const cached = featureResults.get(feature as TFeature);
      if (cached) {
        pluginEngine.emitFeatureEvaluate({
          feature,
          enabled: cached.enabled,
          reason: cached.reason,
          timestamp: Date.now(),
        });
        if (config.debug) {
          debugEngine.recordFeatureEval({
            feature,
            enabled: cached.enabled,
            reason: cached.reason,
            timestamp: Date.now(),
          });
        }
        return cached;
      }

      // Evaluate on-demand if not pre-computed (e.g. dynamic feature name)
      warnOnce(
        `Feature "${feature}" was not found in the config. ` +
          'Ensure feature names match your defineAccess() config.',
      );
      const result = evaluateFeature(
        feature as TFeature,
        baseUser,
        baseConfig,
        baseConfig.environment,
      );
      pluginEngine.emitFeatureEvaluate({
        feature,
        enabled: result.enabled,
        reason: result.reason,
        timestamp: Date.now(),
      });
      return result;
    },
    [featureResults, baseUser, baseConfig, config.debug, debugEngine, pluginEngine],
  );

  // Experiment assignment
  const getExperiment = useCallback(
    (experimentId: string): ExperimentAssignment => {
      const experiments = baseConfig.experiments;
      if (!experiments || !(experimentId in experiments)) {
        warnOnce(
          `Experiment "${experimentId}" not found in config. ` +
            'Returning inactive assignment with "control" variant.',
        );
        return { experimentId, variant: 'control', active: false };
      }
      const experiment = experiments[experimentId]!;
      const assignment = assignExperiment(experiment, baseUser);

      pluginEngine.emitExperimentAssign({
        experimentId,
        variant: assignment.variant,
        userId: baseUser.id,
        timestamp: Date.now(),
      });

      return assignment;
    },
    [baseConfig.experiments, baseUser, pluginEngine],
  );

  // Debug info getter
  const getDebugInfo = useCallback(() => debugEngine.getDebugInfo(), [debugEngine]);

  const contextValue = useMemo(
    () => ({
      config: baseConfig,
      user: baseUser,
      userPermissions,
      featureResults,
      pluginEngine,
      debugEngine,
      checkPermission,
      checkFeature,
      getExperiment,
      getDebugInfo,
    }),
    [
      baseConfig,
      baseUser,
      userPermissions,
      featureResults,
      pluginEngine,
      debugEngine,
      checkPermission,
      checkFeature,
      getExperiment,
      getDebugInfo,
    ],
  );

  return React.createElement(AccessContext.Provider, { value: contextValue }, children);
}
