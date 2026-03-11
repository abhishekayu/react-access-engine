'use client';

import { Shield, Flag, FlaskConical, Layers, Plug, Gauge, Globe, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { StaggerContainer, StaggerItem } from './fade-in';

const features = [
  {
    icon: Shield,
    title: 'RBAC & ABAC',
    description:
      'Role-based and attribute-based access control with wildcard permissions, namespace support, and composable policy rules.',
  },
  {
    icon: Flag,
    title: 'Feature Flags',
    description:
      'Declarative feature gates with role targeting, plan gating, environment scoping, dependencies, and deterministic rollouts.',
  },
  {
    icon: FlaskConical,
    title: 'A/B Experiments',
    description:
      'SSR-safe experiment assignment with percentage-based bucketing, deterministic hashing, and variant tracking.',
  },
  {
    icon: Layers,
    title: 'Plan Gating',
    description:
      "Hierarchical subscription plans with automatic tier comparison. Gate features and UI by the user's current plan.",
  },
  {
    icon: Plug,
    title: 'Plugin System',
    description:
      'Extensible plugin architecture with hooks for access checks, feature evaluations, policy evaluations, and custom condition operators.',
  },
  {
    icon: Globe,
    title: 'Remote Config',
    description:
      'Load access configuration remotely with stale-while-revalidate caching, polling, and optional signature verification.',
  },
  {
    icon: Gauge,
    title: 'DevTools',
    description:
      'Built-in devtools overlay with real-time access checks, feature evaluations, policy traces, and config inspection.',
  },
  {
    icon: Lock,
    title: 'Type-Safe & SSR-Ready',
    description:
      'Full TypeScript inference with InferRoles, InferPermissions, InferFeatures. SSR-safe — works with Next.js App Router.',
  },
];

export function FeatureCards() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
          Everything you need for access control
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-[15px] text-zinc-500 dark:text-zinc-400">
          Stop stitching together RBAC libraries, feature flag services, and experiment platforms.
        </p>
      </div>

      <StaggerContainer className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <StaggerItem key={feature.title}>
            <Card className="group relative h-full overflow-hidden border-zinc-200/80 transition-all duration-300 hover:border-zinc-300 hover:shadow-lg hover:shadow-zinc-200/50 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:shadow-zinc-900/50">
              <div className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-br from-blue-500/5 via-violet-500/5 to-pink-500/5 dark:from-blue-500/10 dark:via-violet-500/10 dark:to-pink-500/5" />
              <CardHeader className="relative pb-2">
                <div className="mb-2 inline-flex rounded-md bg-zinc-100 p-2 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  <feature.icon className="h-4 w-4" />
                </div>
                <CardTitle className="text-sm">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  );
}
