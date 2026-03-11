'use client';

import Link from 'next/link';
import { ArrowRight, Github, Package } from 'lucide-react';
import { CodeBlock } from './code-block';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { FadeIn } from './fade-in';

const heroCode = `import { defineAccess, AccessProvider, Allow, Feature }
  from 'react-access-engine';

const config = defineAccess({
  roles: ['customer', 'seller', 'admin'],
  permissions: {
    customer: ['products:browse', 'cart:manage', 'orders:own'],
    seller:   ['products:create', 'inventory:manage'],
    admin:    ['*'],
  },
  plans: ['free', 'plus', 'premium'],
  features: {
    'quick-buy':  true,
    'ai-recs':    { enabled: true, allowedPlans: ['premium'] },
    'live-chat':  { enabled: true, allowedPlans: ['plus', 'premium'] },
  },
  policies: [{
    id: 'seller-own-products',
    effect: 'allow',
    permissions: ['products:edit'],
    condition: ({ user, resource }) => user.id === resource.sellerId,
  }],
});

function App() {
  return (
    <AccessProvider config={config} user={user}>
      <Allow permission="cart:manage">
        <CartButton />
      </Allow>
      <Feature name="ai-recs" fallback={<UpgradeBanner />}>
        <AIRecommendations />
      </Feature>
    </AccessProvider>
  );
}`;

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* 3D perspective grid floor */}
      <div className="hero-3d-wrapper absolute inset-0 overflow-hidden">
        <div className="hero-3d-grid" />
      </div>

      {/* Floating gradient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="orb-1 absolute -top-20 left-[15%] h-72 w-72 rounded-full bg-blue-500/10 blur-3xl dark:bg-blue-500/15" />
        <div className="orb-2 absolute top-10 right-[10%] h-80 w-80 rounded-full bg-violet-500/10 blur-3xl dark:bg-violet-500/15" />
        <div className="orb-3 absolute bottom-10 left-[40%] h-64 w-64 rounded-full bg-pink-500/8 blur-3xl dark:bg-pink-500/10" />
      </div>

      {/* Radial fade overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-transparent to-white dark:from-zinc-950/60 dark:via-transparent dark:to-zinc-950" />

      {/* Horizon glow */}
      <div className="hero-horizon" />

      {/* Content */}
      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 sm:pt-32 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <FadeIn delay={0}>
              <Badge
                variant="outline"
                className="mb-5 border-blue-200 bg-blue-50/50 text-[11px] font-medium text-blue-600 dark:border-blue-800/50 dark:bg-blue-950/30 dark:text-blue-400"
              >
                v1.0 Production Ready
              </Badge>
            </FadeIn>

            <FadeIn delay={0.1}>
              <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl lg:text-[3.25rem] dark:text-white">
                Unified{' '}
                <span className="gradient-text">Access Control</span>{' '}
                for React
              </h1>
            </FadeIn>

            <FadeIn delay={0.2}>
              <p className="mt-5 max-w-lg text-[15px] leading-7 text-zinc-500 dark:text-zinc-400">
                RBAC, ABAC, feature flags, A/B experiments, plan gating, and remote config — all in
                a single, type-safe, tree-shakeable package.
              </p>
            </FadeIn>

            <FadeIn delay={0.3}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="default">
                  <Link href="/docs/quickstart">
                    Get Started
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="secondary" asChild size="default">
                  <a
                    href="https://github.com/abhishekayu/react-access-engine"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="mr-1 h-4 w-4" />
                    GitHub
                  </a>
                </Button>
                <Button variant="secondary" asChild size="default">
                  <a
                    href="https://www.npmjs.com/package/react-access-engine"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Package className="mr-1 h-4 w-4" />
                    npm
                  </a>
                </Button>
              </div>
            </FadeIn>

            <FadeIn delay={0.4}>
              <div className="mt-7 inline-flex items-center gap-3 rounded-lg border border-zinc-200/80 bg-zinc-900 px-4 py-2.5 shadow-lg shadow-zinc-900/5 dark:border-zinc-700 dark:bg-zinc-800 dark:shadow-black/20">
                <code className="text-sm text-zinc-300">
                  <span className="text-green-400">$</span> npm install react-access-engine
                </code>
              </div>
            </FadeIn>

            <FadeIn delay={0.5}>
              <div className="mt-8 flex items-center gap-6 text-[13px] text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>220 tests</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span>~4KB gzipped</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-violet-500" />
                  <span>Zero deps</span>
                </div>
              </div>
            </FadeIn>
          </div>

          <FadeIn direction="right" delay={0.2} className="relative hidden lg:block">
            <div className="relative">
              <div className="absolute -inset-3 rounded-2xl bg-gradient-to-br from-blue-500/10 via-violet-500/10 to-pink-500/10 blur-xl dark:from-blue-500/15 dark:via-violet-500/15 dark:to-pink-500/10" />
              <div className="relative">
                <CodeBlock code={heroCode} language="tsx" filename="App.tsx" />
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
