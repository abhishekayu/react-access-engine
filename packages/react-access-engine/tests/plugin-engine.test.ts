import { describe, it, expect, vi } from 'vitest';
import { PluginEngine } from '../src/engines/plugin-engine';
import type {
  AccessPlugin,
  AccessCheckEvent,
  FeatureEvaluateEvent,
  PolicyEvaluateEvent,
  ExperimentAssignEvent,
  ConfigLoadEvent,
  RenderDeniedEvent,
  CustomOperator,
} from '../src/types';

function makePlugin(overrides: Partial<AccessPlugin> = {}): AccessPlugin {
  return { name: 'test', ...overrides };
}

describe('PluginEngine', () => {
  it('register adds a plugin', () => {
    const engine = new PluginEngine();
    const plugin = makePlugin({ onAccessCheck: vi.fn() });
    engine.register(plugin);
    engine.emitAccessCheck({ permission: 'x', granted: true, roles: [], timestamp: 0 });
    expect(plugin.onAccessCheck).toHaveBeenCalledOnce();
  });

  it('registerAll adds multiple plugins', () => {
    const engine = new PluginEngine();
    const p1 = makePlugin({ name: 'p1', onAccessCheck: vi.fn() });
    const p2 = makePlugin({ name: 'p2', onAccessCheck: vi.fn() });
    engine.registerAll([p1, p2]);
    engine.emitAccessCheck({ permission: 'x', granted: true, roles: [], timestamp: 0 });
    expect(p1.onAccessCheck).toHaveBeenCalledOnce();
    expect(p2.onAccessCheck).toHaveBeenCalledOnce();
  });

  it('emitAccessCheck dispatches to onAccessCheck', () => {
    const engine = new PluginEngine();
    const fn = vi.fn();
    engine.register(makePlugin({ onAccessCheck: fn }));
    const event: AccessCheckEvent = { permission: 'p', granted: false, roles: ['r'], timestamp: 1 };
    engine.emitAccessCheck(event);
    expect(fn).toHaveBeenCalledWith(event);
  });

  it('emitFeatureEvaluate dispatches to onFeatureEvaluate', () => {
    const engine = new PluginEngine();
    const fn = vi.fn();
    engine.register(makePlugin({ onFeatureEvaluate: fn }));
    const event: FeatureEvaluateEvent = {
      feature: 'f',
      enabled: true,
      reason: 'static',
      timestamp: 1,
    };
    engine.emitFeatureEvaluate(event);
    expect(fn).toHaveBeenCalledWith(event);
  });

  it('emitPolicyEvaluate dispatches to onPolicyEvaluate', () => {
    const engine = new PluginEngine();
    const fn = vi.fn();
    engine.register(makePlugin({ onPolicyEvaluate: fn }));
    const event: PolicyEvaluateEvent = {
      permission: 'p',
      effect: 'allow',
      matchedRule: 'r',
      timestamp: 1,
    };
    engine.emitPolicyEvaluate(event);
    expect(fn).toHaveBeenCalledWith(event);
  });

  it('emitExperimentAssign dispatches to onExperimentAssign', () => {
    const engine = new PluginEngine();
    const fn = vi.fn();
    engine.register(makePlugin({ onExperimentAssign: fn }));
    const event: ExperimentAssignEvent = {
      experimentId: 'e',
      variant: 'v',
      userId: 'u',
      timestamp: 1,
    };
    engine.emitExperimentAssign(event);
    expect(fn).toHaveBeenCalledWith(event);
  });

  it('emitConfigLoad dispatches to onConfigLoad', () => {
    const engine = new PluginEngine();
    const fn = vi.fn();
    engine.register(makePlugin({ onConfigLoad: fn }));
    const event: ConfigLoadEvent = { source: 'url', timestamp: 1 };
    engine.emitConfigLoad(event);
    expect(fn).toHaveBeenCalledWith(event);
  });

  it('emitRenderDenied dispatches to onRenderDenied', () => {
    const engine = new PluginEngine();
    const fn = vi.fn();
    engine.register(makePlugin({ onRenderDenied: fn }));
    const event: RenderDeniedEvent = { component: 'Can', reason: 'denied', timestamp: 1 };
    engine.emitRenderDenied(event);
    expect(fn).toHaveBeenCalledWith(event);
  });

  it('plugin errors do not propagate', () => {
    const engine = new PluginEngine();
    engine.register(
      makePlugin({
        onAccessCheck: () => {
          throw new Error('boom');
        },
      }),
    );
    // Should not throw
    expect(() =>
      engine.emitAccessCheck({ permission: 'x', granted: true, roles: [], timestamp: 0 }),
    ).not.toThrow();
  });

  it('one failing plugin does not block others', () => {
    const engine = new PluginEngine();
    const fn = vi.fn();
    engine.register(
      makePlugin({
        name: 'crasher',
        onAccessCheck: () => {
          throw new Error('boom');
        },
      }),
    );
    engine.register(makePlugin({ name: 'ok', onAccessCheck: fn }));
    engine.emitAccessCheck({ permission: 'x', granted: true, roles: [], timestamp: 0 });
    expect(fn).toHaveBeenCalledOnce();
  });

  it('plugins without a given hook are silently skipped', () => {
    const engine = new PluginEngine();
    engine.register(makePlugin()); // no hooks
    // Should not throw for any event type
    expect(() => {
      engine.emitAccessCheck({ permission: 'x', granted: true, roles: [], timestamp: 0 });
      engine.emitFeatureEvaluate({ feature: 'f', enabled: true, reason: 'static', timestamp: 0 });
      engine.emitPolicyEvaluate({
        permission: 'p',
        effect: 'allow',
        matchedRule: null,
        timestamp: 0,
      });
      engine.emitExperimentAssign({ experimentId: 'e', variant: 'v', userId: 'u', timestamp: 0 });
      engine.emitConfigLoad({ source: 's', timestamp: 0 });
      engine.emitRenderDenied({ component: 'C', reason: 'r', timestamp: 0 });
    }).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// collectOperators
// ---------------------------------------------------------------------------

describe('PluginEngine.collectOperators', () => {
  it('returns empty map when no plugins have operators', () => {
    const engine = new PluginEngine();
    engine.register(makePlugin());
    expect(engine.collectOperators().size).toBe(0);
  });

  it('collects operators from plugins', () => {
    const engine = new PluginEngine();
    const op1: CustomOperator = { name: 'startsWith', evaluate: () => true };
    const op2: CustomOperator = { name: 'endsWith', evaluate: () => true };
    engine.register(makePlugin({ operators: [op1] }));
    engine.register(makePlugin({ operators: [op2] }));
    const map = engine.collectOperators();
    expect(map.size).toBe(2);
    expect(map.get('startsWith')).toBe(op1);
    expect(map.get('endsWith')).toBe(op2);
  });

  it('later plugin operator overwrites earlier with same name', () => {
    const engine = new PluginEngine();
    const first: CustomOperator = { name: 'custom', evaluate: () => false };
    const second: CustomOperator = { name: 'custom', evaluate: () => true };
    engine.register(makePlugin({ operators: [first] }));
    engine.register(makePlugin({ operators: [second] }));
    expect(engine.collectOperators().get('custom')).toBe(second);
  });
});
