'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { AccessConfig, RemoteConfigLoader, RemoteConfigState } from '../types';
import { RemoteConfigEngine } from '../engines/remote-config-engine';
import { mergeConfigs } from '../types';

/**
 * Hook that loads remote config and merges it with a base config.
 * Implements stale-while-revalidate: serves cached data immediately
 * while refreshing in the background.
 *
 * @example
 * ```tsx
 * function App() {
 *   const { config, loading, stale, refresh } = useRemoteConfig(baseConfig, {
 *     url: '/api/access-config',
 *     pollInterval: 60_000,
 *   });
 *   return (
 *     <AccessProvider config={config} user={user}>
 *       {loading && !stale ? <Spinner /> : <Main />}
 *     </AccessProvider>
 *   );
 * }
 * ```
 */
export function useRemoteConfig<
  TRole extends string = string,
  TPermission extends string = string,
  TFeature extends string = string,
  TPlan extends string = string,
  TExperiment extends string = string,
>(
  baseConfig: AccessConfig<TRole, TPermission, TFeature, TPlan, TExperiment>,
  loader: RemoteConfigLoader,
): RemoteConfigState & {
  /** The merged config (base + remote). Serve this to AccessProvider. */
  config: AccessConfig<TRole, TPermission, TFeature, TPlan, TExperiment>;
} {
  const [remoteConfig, setRemoteConfig] = useState<Partial<AccessConfig> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastLoadedAt, setLastLoadedAt] = useState<number | null>(null);

  const engineRef = useRef<RemoteConfigEngine | null>(null);

  // Create engine once
  if (!engineRef.current) {
    engineRef.current = new RemoteConfigEngine({
      loader,
      onConfigLoaded(data) {
        setRemoteConfig(data);
        setLastLoadedAt(Date.now());
        setError(null);
        setLoading(false);
      },
      onError(err) {
        setError(err);
        setLoading(false);
      },
    });
  }

  // Initial load + polling
  useEffect(() => {
    const engine = engineRef.current!;
    void engine.load();
    engine.startPolling();
    return () => engine.destroy();
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await engineRef.current?.refresh();
  }, []);

  const stale = remoteConfig !== null && error !== null;

  const config = remoteConfig
    ? mergeConfigs(baseConfig, remoteConfig as Partial<typeof baseConfig>)
    : baseConfig;

  return { config, loading, error, stale, lastLoadedAt, refresh };
}
