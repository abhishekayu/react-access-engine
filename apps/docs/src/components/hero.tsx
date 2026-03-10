'use client';

import Link from 'next/link';
import { ArrowRight, Github, Package } from 'lucide-react';
import { CodeBlock } from './code-block';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { FadeIn } from './fade-in';

const heroCode = `import { AccessProvider, Can, Feature } from 'react-access-engine';

const config = defineAccess({
  roles: ['admin', 'editor', 'viewer'] as const,
  permissions: {
    admin:  ['*'],
    editor: ['posts:read', 'posts:write', 'posts:publish'],
    viewer: ['posts:read'],
  },
  features: {
    darkMode:    { enabled: true },
    betaEditor:  { enabled: true, roles: ['admin'] },
    newDashboard: { rolloutPercentage: 25 },
  },
});

function App() {
  return (
    <AccessProvider config={config} user={user}>
      <Can permission="posts:write">
        <EditorPanel />
      </Can>
      <Feature name="betaEditor" fallback={<ClassicEditor />}>
        <BetaEditor />
      </Feature>
    </AccessProvider>
  );
}`;

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 grid-pattern" />
      <div className="absolute inset-0 bg-gradient-to-b from-white via-white/95 to-white dark:from-zinc-950 dark:via-zinc-950/95 dark:to-zinc-950" />

      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 sm:pt-32 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left — Text */}
          <div>
            <FadeIn delay={0}>
              <Badge
                variant="secondary"
                className="mb-6 border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-400"
              >
                v1.0 — Production Ready
              </Badge>
            </FadeIn>

            <FadeIn delay={0.1}>
              <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl dark:text-white">
                Unified <span className="gradient-text">Access Control</span> for React
              </h1>
            </FadeIn>

            <FadeIn delay={0.2}>
              <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
                RBAC, ABAC, feature flags, A/B experiments, plan gating, and remote config — all in
                a single, type-safe, tree-shakeable package. SSR-ready for Next.js App Router.
              </p>
            </FadeIn>

            <FadeIn delay={0.3}>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button asChild>
                  <Link href="/docs/quickstart">
                    Get Started
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="secondary" asChild>
                  <a
                    href="https://github.com/example/react-access-engine"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="mr-1 h-4 w-4" />
                    GitHub
                  </a>
                </Button>
                <Button variant="secondary" asChild>
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
              {/* Install command */}
              <div className="mt-8 inline-flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-950 px-4 py-2.5 dark:border-zinc-700">
                <code className="text-sm text-zinc-300">
                  <span className="text-green-400">$</span> npm install react-access-engine
                </code>
              </div>
            </FadeIn>
          </div>

          {/* Right — Code example */}
          <FadeIn direction="right" delay={0.2} className="relative hidden lg:block">
            <div className="absolute -inset-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 blur-2xl" />
            <div className="relative">
              <CodeBlock code={heroCode} language="tsx" filename="App.tsx" />
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
