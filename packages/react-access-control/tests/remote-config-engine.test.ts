import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RemoteConfigEngine } from '../src/engines/remote-config-engine';
import type { RemoteConfigEngineOptions } from '../src/engines/remote-config-engine';

function makeEngine(overrides: Partial<RemoteConfigEngineOptions> = {}): RemoteConfigEngine {
  return new RemoteConfigEngine({
    loader: { load: async () => ({ debug: true }) },
    ...overrides,
  });
}

describe('RemoteConfigEngine — load', () => {
  it('loads config via custom loader', async () => {
    const engine = makeEngine({
      loader: { load: async () => ({ debug: true }) },
    });
    const result = await engine.load();
    expect(result).toEqual({ debug: true });
    expect(engine.cachedConfig).toEqual({ debug: true });
    expect(engine.loading).toBe(false);
    expect(engine.error).toBe(null);
  });

  it('calls onConfigLoaded after successful load', async () => {
    const onConfigLoaded = vi.fn();
    const engine = makeEngine({
      loader: { load: async () => ({ debug: true }) },
      onConfigLoaded,
    });
    await engine.load();
    expect(onConfigLoaded).toHaveBeenCalledOnce();
    expect(onConfigLoaded.mock.calls[0]![0]).toEqual({ debug: true });
  });

  it('returns null and stores error on failure', async () => {
    const onError = vi.fn();
    const engine = makeEngine({
      loader: {
        load: async () => {
          throw new Error('network');
        },
      },
      onError,
    });
    const result = await engine.load();
    expect(result).toBe(null);
    expect(engine.error).toBeInstanceOf(Error);
    expect(engine.error!.message).toBe('network');
    expect(onError).toHaveBeenCalledOnce();
  });

  it('wraps non-Error throws into Error', async () => {
    const engine = makeEngine({
      loader: {
        load: async () => {
          throw 'string error';
        },
      },
    });
    await engine.load();
    expect(engine.error).toBeInstanceOf(Error);
    expect(engine.error!.message).toBe('string error');
  });

  it('lastLoadedAt is set after successful load', async () => {
    const engine = makeEngine();
    expect(engine.lastLoadedAt).toBe(null);
    await engine.load();
    expect(engine.lastLoadedAt).toBeTypeOf('number');
    expect(engine.lastLoadedAt! > 0).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Stale-while-revalidate
// ---------------------------------------------------------------------------

describe('RemoteConfigEngine — stale-while-revalidate', () => {
  it('reports stale=true when cache exists but last load failed', async () => {
    let calls = 0;
    const engine = makeEngine({
      loader: {
        load: async () => {
          calls++;
          if (calls === 1) return { debug: true };
          throw new Error('stale');
        },
      },
    });
    await engine.load(); // success
    expect(engine.stale).toBe(false);
    await engine.load(); // failure
    expect(engine.stale).toBe(true);
    expect(engine.cachedConfig).toEqual({ debug: true }); // cache still valid
  });
});

// ---------------------------------------------------------------------------
// Polling
// ---------------------------------------------------------------------------

describe('RemoteConfigEngine — polling', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('polls at the configured interval', async () => {
    const loadFn = vi.fn(async () => ({ debug: true }));
    const engine = makeEngine({
      loader: { load: loadFn, pollInterval: 1000 },
    });
    engine.startPolling();
    expect(loadFn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);
    expect(loadFn).toHaveBeenCalledOnce();

    vi.advanceTimersByTime(1000);
    expect(loadFn).toHaveBeenCalledTimes(2);

    engine.stopPolling();
  });

  it('stopPolling stops the interval', async () => {
    const loadFn = vi.fn(async () => ({}));
    const engine = makeEngine({
      loader: { load: loadFn, pollInterval: 500 },
    });
    engine.startPolling();
    vi.advanceTimersByTime(500);
    expect(loadFn).toHaveBeenCalledOnce();

    engine.stopPolling();
    vi.advanceTimersByTime(2000);
    expect(loadFn).toHaveBeenCalledOnce(); // no more calls
  });

  it('does not start polling if interval is 0 or negative', () => {
    const loadFn = vi.fn(async () => ({}));
    const engine = makeEngine({
      loader: { load: loadFn, pollInterval: 0 },
    });
    engine.startPolling();
    vi.advanceTimersByTime(5000);
    expect(loadFn).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// refresh / destroy
// ---------------------------------------------------------------------------

describe('RemoteConfigEngine — refresh & destroy', () => {
  it('refresh reloads config', async () => {
    let version = 1;
    const engine = makeEngine({
      loader: { load: async () => ({ debug: true, version: version++ }) as any },
    });
    await engine.load();
    expect((engine.cachedConfig as any).version).toBe(1);
    await engine.refresh();
    expect((engine.cachedConfig as any).version).toBe(2);
  });

  it('destroy clears cache and stops polling', () => {
    vi.useFakeTimers();
    const loadFn = vi.fn(async () => ({}));
    const engine = makeEngine({
      loader: { load: loadFn, pollInterval: 1000 },
    });
    engine.startPolling();
    engine.destroy();
    vi.advanceTimersByTime(5000);
    expect(loadFn).not.toHaveBeenCalled();
    expect(engine.cachedConfig).toBe(null);
    expect(engine.error).toBe(null);
    vi.useRealTimers();
  });
});

// ---------------------------------------------------------------------------
// URL-based loading
// ---------------------------------------------------------------------------

describe('RemoteConfigEngine — URL fetch', () => {
  it('throws when no fetch and no load function', async () => {
    const engine = new RemoteConfigEngine({
      loader: {} as any,
    });
    const result = await engine.load();
    expect(result).toBe(null);
    expect(engine.error!.message).toContain('requires either');
  });
});
