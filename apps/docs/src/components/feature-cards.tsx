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
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-white">
          Everything you need for access control
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
          Stop stitching together RBAC libraries, feature flag services, and experiment platforms.
          One package, one provider, one mental model.
        </p>
      </div>

      <StaggerContainer className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <StaggerItem key={feature.title}>
            <Card className="group h-full transition-all hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/5 dark:hover:border-blue-700">
              <CardHeader className="pb-2">
                <div className="mb-2 inline-flex rounded-lg bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                  <feature.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
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
