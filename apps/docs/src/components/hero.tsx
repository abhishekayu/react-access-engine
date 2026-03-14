'use client';

import Link from 'next/link';
import { ArrowRight, Github } from 'lucide-react';
import { Shield } from 'lucide-react';
import { Button } from './ui/button';
import { FadeIn } from './fade-in';
import { useEffect, useState } from 'react';

const heroCode = `import { defineAccess, AccessProvider, Allow, Feature }
  from 'react-access-engine'

const config = defineAccess({
  roles: ['viewer', 'editor', 'admin'],
  permissions: {
    viewer: ['posts:read'],
    editor: ['posts:read', 'posts:write'],
    admin:  ['*'],
  },
  features: {
    'dark-mode': true,
    'ai-assist': { allowedPlans: ['pro'] },
  },
})

function App() {
  return (
    <AccessProvider config={config} user={user}>
      <Allow permission="posts:write">
        <Editor />
      </Allow>
      <Feature name="ai-assist">
        <AIPanel />
      </Feature>
    </AccessProvider>
  )
}`;

function HeroCode() {
  const [html, setHtml] = useState('');

  useEffect(() => {
    let cancelled = false;
    import('shiki').then(({ codeToHtml }) => {
      codeToHtml(heroCode, {
        lang: 'tsx',
        themes: { light: 'github-light', dark: 'github-dark' },
      }).then((result) => {
        if (!cancelled) setHtml(result);
      });
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="hero-code-wrapper relative">
      {/* Gradient glow behind code block */}
      <div className="hero-code-glow absolute -inset-3 rounded-3xl opacity-60 blur-2xl" />
      <div className="hero-code hero-code-float relative overflow-hidden rounded-2xl border border-zinc-200/50 bg-white/80 shadow-2xl shadow-indigo-900/5 backdrop-blur-md dark:border-zinc-700/40 dark:bg-zinc-900/90 dark:shadow-indigo-500/8">
        <div className="flex items-center gap-1.5 border-b border-zinc-200/60 px-4 py-2.5 dark:border-zinc-700/50">
          <div className="h-2.5 w-2.5 rounded-full bg-red-400/80 dark:bg-red-500/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/80 dark:bg-yellow-500/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-400/80 dark:bg-green-500/60" />
          <span className="ml-2 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">App.tsx</span>
        </div>
        {html ? (
          <div dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <pre className="p-4 text-[13px] leading-relaxed">
            <code className="text-zinc-600 dark:text-zinc-300">{heroCode}</code>
          </pre>
        )}
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-16 lg:pb-24">
      {/* 3D perspective grid */}
      <div className="hero-3d-wrapper pointer-events-none absolute inset-0">
        <div className="hero-3d-grid" />
        <div className="hero-horizon" />
      </div>

      {/* Radial glows for depth */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 h-150 w-225 -translate-x-1/2 rounded-full bg-indigo-400/8 blur-[120px] dark:bg-indigo-500/10" />
        <div className="absolute top-20 right-1/4 h-75 w-100 rounded-full bg-violet-400/6 blur-[100px] dark:bg-violet-500/8" />
        <div className="absolute top-40 left-1/4 h-75 w-75 rounded-full bg-cyan-400/4 blur-[80px] dark:bg-cyan-500/6" />
      </div>

      {/* Centered hero text */}
      <div className="relative mx-auto max-w-4xl px-4 pt-24 sm:px-6 sm:pt-32 lg:pt-40 text-center">
        <FadeIn delay={0.05}>
          <h1 className="mt-7 text-[2.5rem] font-extrabold tracking-tight text-zinc-900 sm:text-[3.25rem] lg:text-[4rem] dark:text-white leading-[1.05]">
            Unified access
            <br />
            control{' '}
            <span className="hero-gradient-text bg-linear-to-r from-indigo-500 via-violet-500 to-purple-500 bg-clip-text text-transparent dark:from-indigo-400 dark:via-violet-400 dark:to-purple-400">
              for React
            </span>
          </h1>
        </FadeIn>

        <FadeIn delay={0.1}>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-zinc-500 dark:text-zinc-400 sm:text-lg sm:leading-relaxed">
            RBAC, feature flags, A/B experiments, plan gating, and remote config in a single, type-safe, tree-shakeable package.
          </p>
        </FadeIn>

        <FadeIn delay={0.15}>
          <div className="mt-7 inline-flex items-center gap-2 rounded-xl border border-zinc-200/80 bg-zinc-50/80 px-4 py-2.5 font-mono text-[13px] text-zinc-600 shadow-sm backdrop-blur-sm dark:border-zinc-700/50 dark:bg-zinc-800/50 dark:text-zinc-400">
            <span className="text-zinc-400 dark:text-zinc-600">$</span>
            npm i react-access-engine
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="default">
              <Link href="/docs/quickstart">
                Get Started
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button variant="secondary" asChild size="default">
              <a
                href="https://github.com/abhishekayu/react-access-engine"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="mr-1.5 h-3.5 w-3.5" />
                GitHub
              </a>
            </Button>
          </div>
        </FadeIn>

        <FadeIn delay={0.25}>
          <div className="mt-7 flex items-center justify-center gap-6 text-[12.5px] text-zinc-400 dark:text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
              220 tests
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
              ~4KB gzipped
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shadow-sm shadow-violet-500/50" />
              0 deps
            </span>
          </div>
        </FadeIn>
      </div>

      {/* Code block — centered below with 3D tilt */}
      <div className="relative mx-auto mt-16 max-w-3xl px-4 sm:px-6 lg:mt-20">
        <FadeIn delay={0.3} direction="up">
          <div className="hero-code-tilt">
            <HeroCode />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
