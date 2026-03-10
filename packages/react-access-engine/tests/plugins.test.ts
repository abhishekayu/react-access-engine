import { describe, it, expect, vi } from 'vitest';
import {
  createAuditLoggerPlugin,
  createAnalyticsPlugin,
  createOperatorPlugin,
} from '../src/plugins';

// ---------------------------------------------------------------------------
// Audit Logger Plugin
// ---------------------------------------------------------------------------

describe('createAuditLoggerPlugin', () => {
  it('logs access check events', () => {
    const log = vi.fn();
    const plugin = createAuditLoggerPlugin({ log });
    plugin.onAccessCheck!({
      permission: 'articles:read',
      granted: true,
      roles: ['editor'],
      timestamp: 1000,
    });
    expect(log).toHaveBeenCalledWith(
      '[audit]',
      'access-check',
      expect.objectContaining({
        permission: 'articles:read',
        granted: true,
      }),
    );
  });

  it('deniedOnly skips granted access checks', () => {
    const log = vi.fn();
    const plugin = createAuditLoggerPlugin({ log, deniedOnly: true });
    plugin.onAccessCheck!({
      permission: 'x',
      granted: true,
      roles: [],
      timestamp: 1000,
    });
    expect(log).not.toHaveBeenCalled();
  });

  it('deniedOnly still logs denied access checks', () => {
    const log = vi.fn();
    const plugin = createAuditLoggerPlugin({ log, deniedOnly: true });
    plugin.onAccessCheck!({
      permission: 'x',
      granted: false,
      roles: [],
      timestamp: 1000,
    });
    expect(log).toHaveBeenCalledOnce();
  });

  it('logs feature & experiment events', () => {
    const log = vi.fn();
    const plugin = createAuditLoggerPlugin({ log });
    plugin.onFeatureEvaluate!({
      feature: 'dark-mode',
      enabled: true,
      reason: 'static',
      timestamp: 1000,
    });
    plugin.onExperimentAssign!({
      experimentId: 'ab-test',
      variant: 'control',
      userId: 'u1',
      timestamp: 1000,
    });
    expect(log).toHaveBeenCalledTimes(2);
  });

  it('logs render denied events', () => {
    const log = vi.fn();
    const plugin = createAuditLoggerPlugin({ log });
    plugin.onRenderDenied!({
      component: 'Can',
      reason: 'no permission',
      timestamp: 1000,
    });
    expect(log).toHaveBeenCalledWith(
      '[audit]',
      'render-denied',
      expect.objectContaining({
        component: 'Can',
      }),
    );
  });

  it('uses console.log by default', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const plugin = createAuditLoggerPlugin();
    plugin.onAccessCheck!({
      permission: 'x',
      granted: true,
      roles: [],
      timestamp: 1000,
    });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// Analytics Plugin
// ---------------------------------------------------------------------------

describe('createAnalyticsPlugin', () => {
  it('tracks denied access checks', () => {
    const track = vi.fn();
    const plugin = createAnalyticsPlugin({ adapter: { track } });
    plugin.onAccessCheck!({
      permission: 'billing:manage',
      granted: false,
      roles: ['viewer'],
      timestamp: 1000,
      reason: 'rbac-deny',
    });
    expect(track).toHaveBeenCalledWith(
      'access.denied',
      expect.objectContaining({
        permission: 'billing:manage',
      }),
    );
  });

  it('does not track granted access checks', () => {
    const track = vi.fn();
    const plugin = createAnalyticsPlugin({ adapter: { track } });
    plugin.onAccessCheck!({
      permission: 'x',
      granted: true,
      roles: [],
      timestamp: 1000,
    });
    expect(track).not.toHaveBeenCalled();
  });

  it('tracks feature evaluations', () => {
    const track = vi.fn();
    const plugin = createAnalyticsPlugin({ adapter: { track } });
    plugin.onFeatureEvaluate!({
      feature: 'dark-mode',
      enabled: true,
      reason: 'static',
      timestamp: 1000,
    });
    expect(track).toHaveBeenCalledWith(
      'access.feature',
      expect.objectContaining({
        feature: 'dark-mode',
      }),
    );
  });

  it('respects trackFeatures=false', () => {
    const track = vi.fn();
    const plugin = createAnalyticsPlugin({ adapter: { track }, trackFeatures: false });
    plugin.onFeatureEvaluate!({
      feature: 'f',
      enabled: true,
      reason: 'static',
      timestamp: 1000,
    });
    expect(track).not.toHaveBeenCalled();
  });

  it('tracks experiment assignments', () => {
    const track = vi.fn();
    const plugin = createAnalyticsPlugin({ adapter: { track } });
    plugin.onExperimentAssign!({
      experimentId: 'e',
      variant: 'v',
      userId: 'u',
      timestamp: 1000,
    });
    expect(track).toHaveBeenCalledWith(
      'access.experiment',
      expect.objectContaining({
        experimentId: 'e',
      }),
    );
  });

  it('uses custom prefix', () => {
    const track = vi.fn();
    const plugin = createAnalyticsPlugin({ adapter: { track }, prefix: 'custom.' });
    plugin.onAccessCheck!({ permission: 'x', granted: false, roles: [], timestamp: 0 });
    expect(track).toHaveBeenCalledWith('custom.denied', expect.any(Object));
  });
});

// ---------------------------------------------------------------------------
// Operator Plugin
// ---------------------------------------------------------------------------

describe('createOperatorPlugin', () => {
  it('exposes operators on the plugin', () => {
    const ops = [
      {
        name: 'startsWith',
        evaluate: (val: unknown, prefix: unknown) =>
          typeof val === 'string' && val.startsWith(String(prefix)),
      },
    ];
    const plugin = createOperatorPlugin(ops);
    expect(plugin.name).toBe('custom-operators');
    expect(plugin.operators).toEqual(ops);
  });
});
