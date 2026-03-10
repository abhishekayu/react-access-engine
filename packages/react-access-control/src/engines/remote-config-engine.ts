// ---------------------------------------------------------------------------
// Remote Config Engine
// ---------------------------------------------------------------------------
// - Load config from HTTP endpoint or custom loader
// - Polling with configurable interval
// - Stale-while-revalidate: serve cached first, refresh in background
// - Fallback config on failure
// - Manual refresh API
// - Architecture for optional signature verification
// - Safe failure: never breaks the app
// ---------------------------------------------------------------------------

import type { AccessConfig, RemoteConfigLoader, ConfigLoadEvent } from '../types';

/** Cache entry stored by the remote config engine. */
interface CacheEntry {
  data: Partial<AccessConfig>;
  timestamp: number;
}

export interface RemoteConfigEngineOptions {
  loader: RemoteConfigLoader;
  onConfigLoaded?: (merged: Partial<AccessConfig>, event: ConfigLoadEvent) => void;
  onError?: (error: Error) => void;
}

export class RemoteConfigEngine {
  private _loader: RemoteConfigLoader;
  private _cache: CacheEntry | null = null;
  private _loading = false;
  private _error: Error | null = null;
  private _pollTimer: ReturnType<typeof setInterval> | null = null;
  private _onConfigLoaded?: (merged: Partial<AccessConfig>, event: ConfigLoadEvent) => void;
  private _onError?: (error: Error) => void;

  constructor(options: RemoteConfigEngineOptions) {
    this._loader = options.loader;
    this._onConfigLoaded = options.onConfigLoaded;
    this._onError = options.onError;
  }

  get loading(): boolean {
    return this._loading;
  }

  get error(): Error | null {
    return this._error;
  }

  get stale(): boolean {
    return this._cache !== null && this._error !== null;
  }

  get lastLoadedAt(): number | null {
    return this._cache?.timestamp ?? null;
  }

  get cachedConfig(): Partial<AccessConfig> | null {
    return this._cache?.data ?? null;
  }

  /**
   * Perform a single load. Returns the loaded partial config.
   * On failure, returns null and stores the error.
   */
  async load(): Promise<Partial<AccessConfig> | null> {
    this._loading = true;
    this._error = null;

    try {
      let data: Partial<AccessConfig>;

      if (this._loader.load) {
        data = await this._loader.load();
      } else if (this._loader.url) {
        data = await this._fetchFromUrl(this._loader.url);
      } else {
        throw new Error(
          '[react-access-control] RemoteConfigLoader requires either `url` or `load`.',
        );
      }

      this._cache = { data, timestamp: Date.now() };
      this._loading = false;

      const event: ConfigLoadEvent = {
        source: this._loader.url ?? 'custom-loader',
        timestamp: Date.now(),
        stale: false,
      };
      this._onConfigLoaded?.(data, event);

      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this._error = error;
      this._loading = false;
      this._onError?.(error);
      return null;
    }
  }

  /**
   * Start polling at the configured interval.
   */
  startPolling(): void {
    this.stopPolling();
    const interval = this._loader.pollInterval;
    if (!interval || interval <= 0) return;

    this._pollTimer = setInterval(() => {
      void this.load();
    }, interval);
  }

  /**
   * Stop polling.
   */
  stopPolling(): void {
    if (this._pollTimer) {
      clearInterval(this._pollTimer);
      this._pollTimer = null;
    }
  }

  /**
   * Manual refresh: load and return the new config.
   */
  async refresh(): Promise<Partial<AccessConfig> | null> {
    return this.load();
  }

  /**
   * Destroy: stop polling and clear cache.
   */
  destroy(): void {
    this.stopPolling();
    this._cache = null;
    this._error = null;
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  private async _fetchFromUrl(url: string): Promise<Partial<AccessConfig>> {
    const fetchFn = typeof globalThis.fetch === 'function' ? globalThis.fetch : null;
    if (!fetchFn) {
      throw new Error(
        '[react-access-control] fetch is not available. Provide a custom `load` function.',
      );
    }

    const response = await fetchFn(url, this._loader.fetchOptions);
    if (!response.ok) {
      throw new Error(
        `[react-access-control] Remote config fetch failed: ${response.status} ${response.statusText}`,
      );
    }

    const text = await response.text();

    // Optional signature verification
    if (this._loader.verifySignature) {
      const sigHeader = this._loader.signatureHeader ?? 'x-config-signature';
      const signature = response.headers.get(sigHeader);
      if (!signature) {
        throw new Error(
          `[react-access-control] Missing signature header "${sigHeader}" on remote config response.`,
        );
      }
      const valid = await this._loader.verifySignature(text, signature);
      if (!valid) {
        throw new Error('[react-access-control] Remote config signature verification failed.');
      }
    }

    return JSON.parse(text) as Partial<AccessConfig>;
  }
}
