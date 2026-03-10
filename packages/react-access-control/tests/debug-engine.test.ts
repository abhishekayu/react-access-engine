import { describe, it, expect, vi } from 'vitest';
import { DebugEngine } from '../src/engines/debug-engine';
import type { AccessCheckEvent, FeatureEvaluateEvent, PolicyEvaluateEvent } from '../src/types';

function makeAccessEvent(overrides: Partial<AccessCheckEvent> = {}): AccessCheckEvent {
  return { permission: 'x', granted: true, roles: [], timestamp: Date.now(), ...overrides };
}

function makeFeatureEvent(overrides: Partial<FeatureEvaluateEvent> = {}): FeatureEvaluateEvent {
  return { feature: 'f', enabled: true, reason: 'static', timestamp: Date.now(), ...overrides };
}

function makePolicyEvent(overrides: Partial<PolicyEvaluateEvent> = {}): PolicyEvaluateEvent {
  return {
    permission: 'p',
    effect: 'allow',
    matchedRule: null,
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('DebugEngine — recording', () => {
  it('records access checks', () => {
    const engine = new DebugEngine();
    engine.recordAccessCheck(makeAccessEvent({ permission: 'a' }));
    engine.recordAccessCheck(makeAccessEvent({ permission: 'b' }));
    const info = engine.getDebugInfo();
    expect(info.lastChecks).toHaveLength(2);
    expect(info.lastChecks[0]!.permission).toBe('a');
  });

  it('records feature evaluations', () => {
    const engine = new DebugEngine();
    engine.recordFeatureEval(makeFeatureEvent({ feature: 'dark-mode' }));
    const info = engine.getDebugInfo();
    expect(info.lastFeatureEvals).toHaveLength(1);
    expect(info.lastFeatureEvals[0]!.feature).toBe('dark-mode');
  });

  it('records policy evaluations', () => {
    const engine = new DebugEngine();
    engine.recordPolicyEval(makePolicyEvent({ permission: 'delete' }));
    const info = engine.getDebugInfo();
    expect(info.lastPolicyEvals).toHaveLength(1);
    expect(info.lastPolicyEvals[0]!.permission).toBe('delete');
  });

  it('getDebugInfo returns copies (not live references)', () => {
    const engine = new DebugEngine();
    engine.recordAccessCheck(makeAccessEvent());
    const info = engine.getDebugInfo();
    info.lastChecks.push(makeAccessEvent({ permission: 'injected' }));
    expect(engine.getDebugInfo().lastChecks).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// MAX_ENTRIES cap
// ---------------------------------------------------------------------------

describe('DebugEngine — MAX_ENTRIES', () => {
  it('caps access checks at 100', () => {
    const engine = new DebugEngine();
    for (let i = 0; i < 120; i++) {
      engine.recordAccessCheck(makeAccessEvent({ permission: `p-${i}` }));
    }
    const info = engine.getDebugInfo();
    expect(info.lastChecks).toHaveLength(100);
    // Oldest entries should have been removed — first entry should be p-20
    expect(info.lastChecks[0]!.permission).toBe('p-20');
  });

  it('caps feature evals at 100', () => {
    const engine = new DebugEngine();
    for (let i = 0; i < 110; i++) {
      engine.recordFeatureEval(makeFeatureEvent({ feature: `f-${i}` }));
    }
    expect(engine.getDebugInfo().lastFeatureEvals).toHaveLength(100);
  });

  it('caps policy evals at 100', () => {
    const engine = new DebugEngine();
    for (let i = 0; i < 105; i++) {
      engine.recordPolicyEval(makePolicyEvent());
    }
    expect(engine.getDebugInfo().lastPolicyEvals).toHaveLength(100);
  });
});

// ---------------------------------------------------------------------------
// subscribe / listener system
// ---------------------------------------------------------------------------

describe('DebugEngine — subscriptions', () => {
  it('calls listener on access check', () => {
    const engine = new DebugEngine();
    const listener = vi.fn();
    engine.subscribe(listener);
    const event = makeAccessEvent();
    engine.recordAccessCheck(event);
    expect(listener).toHaveBeenCalledWith({ type: 'access-check', payload: event });
  });

  it('calls listener on feature eval', () => {
    const engine = new DebugEngine();
    const listener = vi.fn();
    engine.subscribe(listener);
    const event = makeFeatureEvent();
    engine.recordFeatureEval(event);
    expect(listener).toHaveBeenCalledWith({ type: 'feature-eval', payload: event });
  });

  it('calls listener on policy eval', () => {
    const engine = new DebugEngine();
    const listener = vi.fn();
    engine.subscribe(listener);
    const event = makePolicyEvent();
    engine.recordPolicyEval(event);
    expect(listener).toHaveBeenCalledWith({ type: 'policy-eval', payload: event });
  });

  it('calls listener on clear', () => {
    const engine = new DebugEngine();
    const listener = vi.fn();
    engine.subscribe(listener);
    engine.clear();
    expect(listener).toHaveBeenCalledWith({ type: 'clear', payload: null });
  });

  it('unsubscribe removes the listener', () => {
    const engine = new DebugEngine();
    const listener = vi.fn();
    const unsub = engine.subscribe(listener);
    unsub();
    engine.recordAccessCheck(makeAccessEvent());
    expect(listener).not.toHaveBeenCalled();
  });

  it('multiple listeners all receive events', () => {
    const engine = new DebugEngine();
    const l1 = vi.fn();
    const l2 = vi.fn();
    engine.subscribe(l1);
    engine.subscribe(l2);
    engine.recordAccessCheck(makeAccessEvent());
    expect(l1).toHaveBeenCalledOnce();
    expect(l2).toHaveBeenCalledOnce();
  });

  it('listener errors do not propagate', () => {
    const engine = new DebugEngine();
    engine.subscribe(() => {
      throw new Error('boom');
    });
    expect(() => engine.recordAccessCheck(makeAccessEvent())).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// clear
// ---------------------------------------------------------------------------

describe('DebugEngine — clear', () => {
  it('clears all recorded events', () => {
    const engine = new DebugEngine();
    engine.recordAccessCheck(makeAccessEvent());
    engine.recordFeatureEval(makeFeatureEvent());
    engine.recordPolicyEval(makePolicyEvent());
    engine.clear();
    const info = engine.getDebugInfo();
    expect(info.lastChecks).toHaveLength(0);
    expect(info.lastFeatureEvals).toHaveLength(0);
    expect(info.lastPolicyEvals).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// setConfig
// ---------------------------------------------------------------------------

describe('DebugEngine — setConfig', () => {
  it('stores config snapshot for getDebugInfo', () => {
    const engine = new DebugEngine();
    const config = { roles: ['admin'] as const, permissions: { admin: ['*'] as const } };
    engine.setConfig(config as any);
    const info = engine.getDebugInfo();
    expect(info.configSnapshot).toEqual(config);
  });

  it('returns fallback config when setConfig was never called', () => {
    const engine = new DebugEngine();
    const info = engine.getDebugInfo();
    expect(info.configSnapshot).toEqual({ roles: [], permissions: {} });
  });
});
