'use client';

import { useState, useMemo } from 'react';
import { defineAccess, AccessProvider, Can, Feature, Experiment } from 'react-access-control';
import type { AccessConfig } from 'react-access-control';
import {
  Shield,
  Flag,
  FlaskConical,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Server,
  Bug,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CodeBlock } from '@/components/code-block';
import { Badge } from '@/components/ui/badge';

const allRoles = ['admin', 'editor', 'viewer'] as const;
const allPermissions = [
  'posts:read',
  'posts:write',
  'posts:delete',
  'posts:publish',
  'users:read',
  'users:write',
  'users:delete',
  'settings:read',
  'settings:write',
  'billing:read',
  'billing:manage',
] as const;

const allFeatures = [
  'darkMode',
  'betaEditor',
  'newDashboard',
  'aiAssistant',
  'advancedAnalytics',
] as const;
const allPlans = ['free', 'pro', 'enterprise'] as const;
const allCountries = ['US', 'GB', 'DE', 'JP', 'BR', 'IN', 'AU', 'CA'] as const;
const allEnvironments = ['development', 'staging', 'production'] as const;

function buildConfig(
  selectedRoles: string[],
  selectedPerms: Record<string, string[]>,
  features: Record<string, boolean>,
  plans: readonly string[],
  environment: string,
) {
  return defineAccess({
    roles: allRoles as unknown as string[],
    permissions: selectedPerms as Record<string, string[]>,
    features: Object.fromEntries(
      Object.entries(features).map(([k, v]) => [
        k,
        { enabled: v, environments: environment === 'production' ? undefined : [environment] },
      ]),
    ),
    plans: plans as unknown as string[],
    experiments: {
      'checkout-flow': {
        id: 'checkout-flow',
        active: true,
        variants: ['control', 'optimized'],
        defaultVariant: 'control',
        allocation: { control: 50, optimized: 50 },
      },
    },
    debug: true,
  });
}

function Section({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-white"
      >
        <span className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-blue-500" />
          {title}
        </span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && (
        <div className="border-t border-zinc-200 px-4 py-3 dark:border-zinc-700">{children}</div>
      )}
    </div>
  );
}

function CheckBadge({ allowed }: { allowed: boolean }) {
  return (
    <Badge variant={allowed ? 'success' : 'destructive'} className="gap-1">
      {allowed ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
      {allowed ? 'Allowed' : 'Denied'}
    </Badge>
  );
}

interface DebugEntry {
  check: string;
  result: boolean;
  reason: string;
}

function DebugPanel({ entries }: { entries: DebugEntry[] }) {
  return (
    <div className="space-y-2">
      <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        <Bug className="h-3.5 w-3.5" />
        Debug Trace
      </h4>
      <div className="max-h-48 space-y-1 overflow-y-auto rounded-md bg-zinc-950 p-3 text-xs font-mono">
        {entries.length === 0 ? (
          <span className="text-zinc-500">Interact with controls to see traces...</span>
        ) : (
          entries.map((entry, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className={entry.result ? 'text-emerald-400' : 'text-red-400'}>
                {entry.result ? '✓' : '✗'}
              </span>
              <span className="text-zinc-300">{entry.check}</span>
              <span className="ml-auto shrink-0 text-zinc-500">{entry.reason}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function LivePreview({ onDebug: _onDebug }: { onDebug: (entries: DebugEntry[]) => void }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Live Access Preview</h3>

      {allPermissions.map((perm) => (
        <Can
          key={perm}
          permission={perm}
          fallback={
            <div className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2 dark:bg-zinc-800/50">
              <code className="text-xs text-zinc-500">{perm}</code>
              <CheckBadge allowed={false} />
            </div>
          }
        >
          <div className="flex items-center justify-between rounded-md bg-emerald-50 px-3 py-2 dark:bg-emerald-900/20">
            <code className="text-xs text-zinc-700 dark:text-zinc-300">{perm}</code>
            <CheckBadge allowed={true} />
          </div>
        </Can>
      ))}

      <div className="mt-4 border-t border-zinc-200 pt-3 dark:border-zinc-700">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Features
        </h4>
        {allFeatures.map((feat) => (
          <Feature
            key={feat}
            name={feat}
            fallback={
              <div className="mb-1 flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2 dark:bg-zinc-800/50">
                <code className="text-xs text-zinc-500">{feat}</code>
                <CheckBadge allowed={false} />
              </div>
            }
          >
            <div className="mb-1 flex items-center justify-between rounded-md bg-emerald-50 px-3 py-2 dark:bg-emerald-900/20">
              <code className="text-xs text-zinc-700 dark:text-zinc-300">{feat}</code>
              <CheckBadge allowed={true} />
            </div>
          </Feature>
        ))}
      </div>

      <div className="mt-4 border-t border-zinc-200 pt-3 dark:border-zinc-700">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Experiment
        </h4>
        <Experiment
          id="checkout-flow"
          variants={{
            control: (
              <div className="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                Assigned variant: <strong>control</strong>
              </div>
            ),
            optimized: (
              <div className="rounded-md bg-purple-50 px-3 py-2 text-xs text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                Assigned variant: <strong>optimized</strong>
              </div>
            ),
          }}
          fallback={<div className="text-xs text-zinc-500">No experiment</div>}
        />
      </div>
    </div>
  );
}

export default function PlaygroundPage() {
  const [userRoles, setUserRoles] = useState<string[]>(['editor']);
  const [userPlan, setUserPlan] = useState<string>('pro');
  const [userId, setUserId] = useState('user-42');
  const [country, setCountry] = useState<string>('US');
  const [environment, setEnvironment] = useState<string>('production');
  const [debugEntries, setDebugEntries] = useState<DebugEntry[]>([]);
  const [features, setFeatures] = useState<Record<string, boolean>>({
    darkMode: true,
    betaEditor: true,
    newDashboard: false,
    aiAssistant: true,
    advancedAnalytics: false,
  });

  const permissionMap = useMemo(
    () => ({
      admin: [...allPermissions],
      editor: ['posts:read', 'posts:write', 'posts:publish'],
      viewer: ['posts:read'],
    }),
    [],
  );

  const config = useMemo(
    () => buildConfig(userRoles, permissionMap, features, allPlans, environment),
    [userRoles, permissionMap, features, environment],
  );

  const user = useMemo(
    () => ({
      id: userId,
      roles: userRoles,
      plan: userPlan,
      attributes: { department: 'engineering', country },
    }),
    [userId, userRoles, userPlan, country],
  );

  // Build debug traces from current state
  useMemo(() => {
    const entries: DebugEntry[] = [];
    const userPerms = userRoles.flatMap(
      (r) => (permissionMap as Record<string, string[]>)[r] || [],
    );
    for (const perm of allPermissions) {
      const allowed = userPerms.includes(perm) || userPerms.includes('*');
      entries.push({
        check: `permission:${perm}`,
        result: allowed,
        reason: allowed ? `role:${userRoles.join(',')}` : 'no matching role',
      });
    }
    for (const feat of allFeatures) {
      entries.push({
        check: `feature:${feat}`,
        result: features[feat],
        reason: features[feat] ? 'enabled' : 'disabled',
      });
    }
    setDebugEntries(entries);
  }, [userRoles, features, permissionMap]);

  const configCode = `const config = defineAccess({
  roles: ${JSON.stringify([...allRoles])},
  permissions: ${JSON.stringify(permissionMap, null, 2)},
  features: ${JSON.stringify(Object.fromEntries(Object.entries(features).map(([k, v]) => [k, { enabled: v }])), null, 2)},
  plans: ${JSON.stringify([...allPlans])},
});

const user = ${JSON.stringify(user, null, 2)};`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Interactive Playground
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Configure roles, permissions, features, and plans — see access checks resolve in
          real-time.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left — Controls */}
        <div className="space-y-4">
          <Section title="User" icon={Shield}>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  User ID
                </label>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Roles
                </label>
                <div className="flex flex-wrap gap-2">
                  {allRoles.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() =>
                        setUserRoles((prev) =>
                          prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
                        )
                      }
                      className={cn(
                        'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                        userRoles.includes(role)
                          ? 'bg-blue-600 text-white'
                          : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
                      )}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Plan
                </label>
                <div className="flex gap-2">
                  {allPlans.map((plan) => (
                    <button
                      key={plan}
                      type="button"
                      onClick={() => setUserPlan(plan)}
                      className={cn(
                        'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                        userPlan === plan
                          ? 'bg-purple-600 text-white'
                          : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
                      )}
                    >
                      {plan}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          <Section title="Environment" icon={Server}>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Country
                </label>
                <div className="flex flex-wrap gap-2">
                  {allCountries.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCountry(c)}
                      className={cn(
                        'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                        country === c
                          ? 'bg-emerald-600 text-white'
                          : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Environment
                </label>
                <div className="flex gap-2">
                  {allEnvironments.map((env) => (
                    <button
                      key={env}
                      type="button"
                      onClick={() => setEnvironment(env)}
                      className={cn(
                        'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                        environment === env
                          ? 'bg-amber-600 text-white'
                          : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
                      )}
                    >
                      {env}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          <Section title="Feature Flags" icon={Flag}>
            <div className="space-y-2">
              {allFeatures.map((feat) => (
                <label key={feat} className="flex items-center justify-between">
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">{feat}</span>
                  <button
                    type="button"
                    onClick={() => setFeatures((prev) => ({ ...prev, [feat]: !prev[feat] }))}
                    className={cn(
                      'relative h-5 w-9 rounded-full transition-colors',
                      features[feat] ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-600',
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
                        features[feat] ? 'translate-x-4' : 'translate-x-0.5',
                      )}
                    />
                  </button>
                </label>
              ))}
            </div>
          </Section>

          <Section title="Debug Trace" icon={Bug} defaultOpen={false}>
            <DebugPanel entries={debugEntries} />
          </Section>

          <Section title="Generated Config" icon={FlaskConical} defaultOpen={false}>
            <CodeBlock code={configCode} language="tsx" />
          </Section>
        </div>

        {/* Right — Preview */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
          <AccessProvider config={config as AccessConfig} user={user}>
            <LivePreview onDebug={setDebugEntries} />
          </AccessProvider>
        </div>
      </div>
    </div>
  );
}
