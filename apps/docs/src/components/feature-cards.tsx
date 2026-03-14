'use client';

import { Shield, Flag, FlaskConical, Layers, Plug, Gauge, Globe, Lock } from 'lucide-react';
import { StaggerContainer, StaggerItem } from './fade-in';
import { FadeIn } from './fade-in';

const features = [
  {
    icon: Shield,
    title: 'RBAC & ABAC',
    description:
      'Role-based and attribute-based access control with wildcard permissions, namespace support, and composable policy rules.',
    color: 'from-indigo-500 to-blue-500',
    iconBg: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400',
  },
  {
    icon: Flag,
    title: 'Feature Flags',
    description:
      'Declarative feature gates with role targeting, plan gating, environment scoping, dependencies, and deterministic rollouts.',
    color: 'from-emerald-500 to-teal-500',
    iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  },
  {
    icon: FlaskConical,
    title: 'A/B Experiments',
    description:
      'SSR-safe experiment assignment with percentage-based bucketing, deterministic hashing, and variant tracking.',
    color: 'from-violet-500 to-purple-500',
    iconBg: 'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400',
  },
  {
    icon: Layers,
    title: 'Plan Gating',
    description:
      "Hierarchical subscription plans with automatic tier comparison. Gate features and UI by the user's current plan.",
    color: 'from-amber-500 to-orange-500',
    iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
  },
  {
    icon: Plug,
    title: 'Plugin System',
    description:
      'Extensible plugin architecture with hooks for access checks, feature evaluations, policy evaluations, and custom condition operators.',
    color: 'from-pink-500 to-rose-500',
    iconBg: 'bg-pink-100 text-pink-600 dark:bg-pink-500/15 dark:text-pink-400',
  },
  {
    icon: Globe,
    title: 'Remote Config',
    description:
      'Load access configuration remotely with stale-while-revalidate caching, polling, and optional signature verification.',
    color: 'from-cyan-500 to-blue-500',
    iconBg: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-400',
  },
  {
    icon: Gauge,
    title: 'DevTools',
    description:
      'Built-in devtools overlay with real-time access checks, feature evaluations, policy traces, and config inspection.',
    color: 'from-orange-500 to-red-500',
    iconBg: 'bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400',
  },
  {
    icon: Lock,
    title: 'Type-Safe & SSR-Ready',
    description:
      'Full TypeScript inference with InferRoles, InferPermissions, InferFeatures. SSR-safe — works with Next.js App Router.',
    color: 'from-blue-500 to-indigo-500',
    iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
  },
];

export function FeatureCards() {
  return (
    <section className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <FadeIn>
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl lg:text-4xl dark:text-white">
            Everything you need for access control
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-zinc-500 dark:text-zinc-400 sm:text-base">
            Stop stitching together RBAC libraries, feature flag services, and experiment platforms.
          </p>
        </div>
      </FadeIn>

      <StaggerContainer className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <StaggerItem key={feature.title}>
            <div className="feature-card group relative h-full rounded-2xl border border-zinc-200/60 bg-white/70 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-zinc-900/5 dark:border-zinc-800/60 dark:bg-zinc-900/50 dark:hover:border-zinc-700/80 dark:hover:shadow-zinc-900/30">
              {/* Gradient border on hover */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className={`absolute -inset-px rounded-2xl bg-linear-to-br ${feature.color} opacity-10`} />
              </div>
              <div className="relative">
                <div className={`mb-3 inline-flex rounded-xl p-2.5 ${feature.iconBg}`}>
                  <feature.icon className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <h3 className="text-[14px] font-semibold text-zinc-900 dark:text-white">{feature.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {feature.description}
                </p>
              </div>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  );
}
