import type { Metadata } from 'next';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'Changelog',
  description: 'Release history and changelog for react-access-engine.',
};

export default function ChangelogPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Changelog</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        All notable changes to react-access-engine are documented here.
      </p>

      <div className="mt-12 space-y-12">
        {/* v1.0.0 */}
        <section>
          <div className="flex items-baseline gap-3">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">v1.0.0</h2>
            <Badge variant="success">Latest</Badge>
            <time className="text-sm text-zinc-500">2025-01-01</time>
          </div>
          <div className="mt-4 space-y-4 border-l-2 border-zinc-200 pl-4 dark:border-zinc-700">
            <div>
              <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                Added
              </h3>
              <ul className="mt-1 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                <li>
                  RBAC with wildcard permissions (
                  <code className="text-xs bg-zinc-100 px-1 rounded dark:bg-zinc-800">*</code>,{' '}
                  <code className="text-xs bg-zinc-100 px-1 rounded dark:bg-zinc-800">
                    namespace:*
                  </code>
                  )
                </li>
                <li>ABAC policy engine with declarative conditions and custom operators</li>
                <li>
                  Feature flags with role targeting, plan gating, environment scoping, rollouts, and
                  dependencies
                </li>
                <li>A/B experiments with deterministic SSR-safe assignment</li>
                <li>Plan/subscription gating with hierarchical tier comparison</li>
                <li>
                  Remote config loader with stale-while-revalidate caching and signature
                  verification
                </li>
                <li>Plugin system with audit logger, analytics, and operator plugins</li>
                <li>Debug engine with event recording and real-time subscriptions</li>
                <li>
                  DevTools overlay package (
                  <code className="text-xs bg-zinc-100 px-1 rounded dark:bg-zinc-800">
                    react-access-engine-devtools
                  </code>
                  )
                </li>
                <li>Full TypeScript inference helpers</li>
                <li>SSR-safe architecture (Next.js App Router compatible)</li>
                <li>
                  10 React components:{' '}
                  <code className="text-xs bg-zinc-100 px-1 rounded dark:bg-zinc-800">
                    AccessProvider
                  </code>
                  , <code className="text-xs bg-zinc-100 px-1 rounded dark:bg-zinc-800">Can</code>,{' '}
                  <code className="text-xs bg-zinc-100 px-1 rounded dark:bg-zinc-800">Feature</code>
                  ,{' '}
                  <code className="text-xs bg-zinc-100 px-1 rounded dark:bg-zinc-800">
                    AccessGate
                  </code>
                  ,{' '}
                  <code className="text-xs bg-zinc-100 px-1 rounded dark:bg-zinc-800">
                    PermissionGuard
                  </code>
                  ,{' '}
                  <code className="text-xs bg-zinc-100 px-1 rounded dark:bg-zinc-800">
                    FeatureToggle
                  </code>
                  ,{' '}
                  <code className="text-xs bg-zinc-100 px-1 rounded dark:bg-zinc-800">
                    Experiment
                  </code>
                  , and more
                </li>
                <li>
                  9 React hooks:{' '}
                  <code className="text-xs bg-zinc-100 px-1 rounded dark:bg-zinc-800">
                    useAccess
                  </code>
                  ,{' '}
                  <code className="text-xs bg-zinc-100 px-1 rounded dark:bg-zinc-800">
                    usePermission
                  </code>
                  ,{' '}
                  <code className="text-xs bg-zinc-100 px-1 rounded dark:bg-zinc-800">useRole</code>
                  ,{' '}
                  <code className="text-xs bg-zinc-100 px-1 rounded dark:bg-zinc-800">
                    useFeature
                  </code>
                  ,{' '}
                  <code className="text-xs bg-zinc-100 px-1 rounded dark:bg-zinc-800">
                    usePolicy
                  </code>
                  ,{' '}
                  <code className="text-xs bg-zinc-100 px-1 rounded dark:bg-zinc-800">
                    useExperiment
                  </code>
                  ,{' '}
                  <code className="text-xs bg-zinc-100 px-1 rounded dark:bg-zinc-800">usePlan</code>
                  ,{' '}
                  <code className="text-xs bg-zinc-100 px-1 rounded dark:bg-zinc-800">
                    useRemoteConfig
                  </code>
                  ,{' '}
                  <code className="text-xs bg-zinc-100 px-1 rounded dark:bg-zinc-800">
                    useAccessDebug
                  </code>
                </li>
                <li>202 tests passing with comprehensive coverage</li>
              </ul>
            </div>
          </div>
        </section>

        {/* v0.1.0 */}
        <section>
          <div className="flex items-baseline gap-3">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">v0.1.0</h2>
            <time className="text-sm text-zinc-500">2024-12-01</time>
          </div>
          <div className="mt-4 space-y-4 border-l-2 border-zinc-200 pl-4 dark:border-zinc-700">
            <div>
              <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                Added
              </h3>
              <ul className="mt-1 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                <li>Initial project scaffolding with pnpm monorepo + TurboRepo</li>
                <li>Core RBAC engine with role and permission checking</li>
                <li>Basic feature flag engine</li>
                <li>AccessProvider and Can component</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
