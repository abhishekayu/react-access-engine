import type {
  AccessPlugin,
  AccessCheckEvent,
  FeatureEvaluateEvent,
  PolicyEvaluateEvent,
  ExperimentAssignEvent,
  ConfigLoadEvent,
  RenderDeniedEvent,
  CustomOperator,
} from '../types';

// ---------------------------------------------------------------------------
// Plugin Engine
// ---------------------------------------------------------------------------
// Manages plugin registration and event dispatch.
// Plugins receive lifecycle events for audit, logging, analytics, etc.
// ---------------------------------------------------------------------------

export class PluginEngine {
  private plugins: AccessPlugin[] = [];

  register(plugin: AccessPlugin): void {
    this.plugins.push(plugin);
  }

  registerAll(plugins: readonly AccessPlugin[]): void {
    for (const plugin of plugins) {
      this.register(plugin);
    }
  }

  emitAccessCheck(event: AccessCheckEvent): void {
    for (const plugin of this.plugins) {
      try {
        plugin.onAccessCheck?.(event);
      } catch {
        // Plugin errors should not break the application
      }
    }
  }

  emitFeatureEvaluate(event: FeatureEvaluateEvent): void {
    for (const plugin of this.plugins) {
      try {
        plugin.onFeatureEvaluate?.(event);
      } catch {
        // Plugin errors should not break the application
      }
    }
  }

  emitPolicyEvaluate(event: PolicyEvaluateEvent): void {
    for (const plugin of this.plugins) {
      try {
        plugin.onPolicyEvaluate?.(event);
      } catch {
        // Plugin errors should not break the application
      }
    }
  }

  emitExperimentAssign(event: ExperimentAssignEvent): void {
    for (const plugin of this.plugins) {
      try {
        plugin.onExperimentAssign?.(event);
      } catch {
        // Plugin errors should not break the application
      }
    }
  }

  emitConfigLoad(event: ConfigLoadEvent): void {
    for (const plugin of this.plugins) {
      try {
        plugin.onConfigLoad?.(event);
      } catch {
        // Plugin errors should not break the application
      }
    }
  }

  emitRenderDenied(event: RenderDeniedEvent): void {
    for (const plugin of this.plugins) {
      try {
        plugin.onRenderDenied?.(event);
      } catch {
        // Plugin errors should not break the application
      }
    }
  }

  /** Collect all custom operators registered by plugins */
  collectOperators(): ReadonlyMap<string, CustomOperator> {
    const map = new Map<string, CustomOperator>();
    for (const plugin of this.plugins) {
      if (plugin.operators) {
        for (const op of plugin.operators) {
          map.set(op.name, op);
        }
      }
    }
    return map;
  }
}
