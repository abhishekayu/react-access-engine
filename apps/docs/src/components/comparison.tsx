'use client';

import { Check, X } from 'lucide-react';
import { FadeIn } from './fade-in';

const rows = [
  {
    feature: 'RBAC with wildcard permissions',
    rac: true,
    rbacLib: true,
    flagService: false,
    diy: 'partial',
  },
  {
    feature: 'ABAC / Policy engine',
    rac: true,
    rbacLib: false,
    flagService: false,
    diy: 'partial',
  },
  { feature: 'Feature flags', rac: true, rbacLib: false, flagService: true, diy: false },
  { feature: 'A/B Experiments', rac: true, rbacLib: false, flagService: 'partial', diy: false },
  {
    feature: 'Plan / subscription gating',
    rac: true,
    rbacLib: false,
    flagService: false,
    diy: 'partial',
  },
  {
    feature: 'Remote config with polling',
    rac: true,
    rbacLib: false,
    flagService: true,
    diy: false,
  },
  { feature: 'Plugin system', rac: true, rbacLib: false, flagService: false, diy: false },
  { feature: 'DevTools overlay', rac: true, rbacLib: false, flagService: 'partial', diy: false },
  {
    feature: 'SSR-safe (Next.js)',
    rac: true,
    rbacLib: 'partial',
    flagService: 'partial',
    diy: 'partial',
  },
  { feature: 'Tree-shakeable', rac: true, rbacLib: true, flagService: false, diy: true },
  { feature: 'Zero dependencies', rac: true, rbacLib: true, flagService: false, diy: true },
  { feature: 'Type-safe inference', rac: true, rbacLib: false, flagService: false, diy: 'partial' },
] as const;

function Cell({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="mx-auto h-4 w-4 text-emerald-500" />;
  if (value === false) return <X className="mx-auto h-4 w-4 text-zinc-300 dark:text-zinc-600" />;
  return <span className="text-[11px] font-medium text-amber-500">Partial</span>;
}

export function Comparison() {
  return (
    <section className="border-y border-zinc-100 bg-zinc-50/50 py-20 dark:border-zinc-800/50 dark:bg-zinc-900/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
              Why react-access-engine?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[15px] text-zinc-500 dark:text-zinc-400">
              Compare with combining separate RBAC libraries, feature flag services, and DIY
              solutions.
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="mt-10 overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="w-full min-w-[640px] text-[13px]">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="px-4 py-2.5 text-left font-semibold text-zinc-900 dark:text-white">
                    Feature
                  </th>
                  <th className="px-4 py-2.5 text-center font-semibold text-zinc-900 dark:text-white">
                    RAE
                  </th>
                  <th className="px-4 py-2.5 text-center font-medium text-zinc-400">
                    RBAC Lib
                  </th>
                  <th className="px-4 py-2.5 text-center font-medium text-zinc-400">
                    Flag Service
                  </th>
                  <th className="px-4 py-2.5 text-center font-medium text-zinc-400">
                    DIY
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {rows.map((row) => (
                  <tr key={row.feature}>
                    <td className="px-4 py-2.5 text-zinc-600 dark:text-zinc-300">{row.feature}</td>
                    <td className="px-4 py-2.5 text-center">
                      <Cell value={row.rac} />
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <Cell value={row.rbacLib} />
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <Cell value={row.flagService} />
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <Cell value={row.diy} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
