// ---------------------------------------------------------------------------
// Example Plugins
// ---------------------------------------------------------------------------
// Ready-to-use plugin implementations that demonstrate the plugin system.
// These are tree-shakeable — only imported plugins are bundled.
// ---------------------------------------------------------------------------

import type { AccessPlugin, CustomOperator } from '../types';

// ======================== Audit Logger Plugin ===============================

export interface AuditLoggerOptions {
  /** Custom log function. Defaults to `console.log`. */
  log?: (...args: unknown[]) => void;
  /** Only log denied access checks. */
  deniedOnly?: boolean;
}

/**
 * Logs all access evaluations to a configurable output.
 *
 * @example
 * ```ts
 * const config = defineAccess({
 *   plugins: [createAuditLoggerPlugin({ deniedOnly: true })],
 * });
 * ```
 */
export function createAuditLoggerPlugin(options?: AuditLoggerOptions): AccessPlugin {
  const log = options?.log ?? console.log;
  const deniedOnly = options?.deniedOnly ?? false;

  return {
    name: 'audit-logger',
    onAccessCheck(event) {
      if (deniedOnly && event.granted) return;
      log('[audit]', 'access-check', {
        permission: event.permission,
        granted: event.granted,
        reason: event.reason,
        reasonCode: event.reasonCode,
        roles: event.roles,
        resource: event.resource,
        timestamp: new Date(event.timestamp).toISOString(),
      });
    },
    onFeatureEvaluate(event) {
      log('[audit]', 'feature-eval', {
        feature: event.feature,
        enabled: event.enabled,
        reason: event.reason,
        segment: event.segment,
        timestamp: new Date(event.timestamp).toISOString(),
      });
    },
    onPolicyEvaluate(event) {
      if (deniedOnly && event.effect === 'allow') return;
      log('[audit]', 'policy-eval', {
        permission: event.permission,
        effect: event.effect,
        matchedRule: event.matchedRule,
        matchedPolicy: event.matchedPolicy,
        timestamp: new Date(event.timestamp).toISOString(),
      });
    },
    onExperimentAssign(event) {
      log('[audit]', 'experiment-assign', {
        experimentId: event.experimentId,
        variant: event.variant,
        userId: event.userId,
        timestamp: new Date(event.timestamp).toISOString(),
      });
    },
    onRenderDenied(event) {
      log('[audit]', 'render-denied', {
        component: event.component,
        reason: event.reason,
        meta: event.meta,
        timestamp: new Date(event.timestamp).toISOString(),
      });
    },
  };
}

// ======================== Analytics Plugin ==================================

export interface AnalyticsAdapter {
  track: (eventName: string, properties: Record<string, unknown>) => void;
}

export interface AnalyticsPluginOptions {
  adapter: AnalyticsAdapter;
  /** Prefix for event names. Defaults to `"access."`. */
  prefix?: string;
  /** Track feature evaluations. Default true. */
  trackFeatures?: boolean;
  /** Track experiment assignments. Default true. */
  trackExperiments?: boolean;
  /** Track denied access checks. Default true. */
  trackDenied?: boolean;
}

/**
 * Sends access events to an analytics provider.
 *
 * @example
 * ```ts
 * const config = defineAccess({
 *   plugins: [
 *     createAnalyticsPlugin({
 *       adapter: { track: (name, props) => mixpanel.track(name, props) },
 *     }),
 *   ],
 * });
 * ```
 */
export function createAnalyticsPlugin(options: AnalyticsPluginOptions): AccessPlugin {
  const { adapter, prefix = 'access.' } = options;
  const trackFeatures = options.trackFeatures ?? true;
  const trackExperiments = options.trackExperiments ?? true;
  const trackDenied = options.trackDenied ?? true;

  return {
    name: 'analytics',
    onAccessCheck(event) {
      if (!event.granted && trackDenied) {
        adapter.track(`${prefix}denied`, {
          permission: event.permission,
          reason: event.reason,
          reasonCode: event.reasonCode,
        });
      }
    },
    onFeatureEvaluate(event) {
      if (!trackFeatures) return;
      adapter.track(`${prefix}feature`, {
        feature: event.feature,
        enabled: event.enabled,
        reason: event.reason,
        segment: event.segment,
      });
    },
    onExperimentAssign(event) {
      if (!trackExperiments) return;
      adapter.track(`${prefix}experiment`, {
        experimentId: event.experimentId,
        variant: event.variant,
        userId: event.userId,
      });
    },
    onRenderDenied(event) {
      if (!trackDenied) return;
      adapter.track(`${prefix}render_denied`, {
        component: event.component,
        reason: event.reason,
      });
    },
  };
}

// ======================== Custom Operator Plugin ============================

/**
 * Creates a plugin that registers custom operators for the condition engine.
 *
 * @example
 * ```ts
 * const config = defineAccess({
 *   plugins: [
 *     createOperatorPlugin([
 *       { name: 'matchesRegex', evaluate: (val, pattern) =>
 *           typeof val === 'string' && new RegExp(String(pattern)).test(val) },
 *       { name: 'startsWith', evaluate: (val, prefix) =>
 *           typeof val === 'string' && val.startsWith(String(prefix)) },
 *     ]),
 *   ],
 * });
 * ```
 */
export function createOperatorPlugin(operators: readonly CustomOperator[]): AccessPlugin {
  return {
    name: 'custom-operators',
    operators,
  };
}
