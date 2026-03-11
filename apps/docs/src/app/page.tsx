'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Hero } from '@/components/hero';
import { FeatureCards } from '@/components/feature-cards';
import { Comparison } from '@/components/comparison';
import { Button } from '@/components/ui/button';
import { FadeIn } from '@/components/fade-in';

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeatureCards />
      <Comparison />

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-zinc-50 px-8 py-16 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-24 left-1/2 h-48 w-[60%] -translate-x-1/2 rounded-full bg-blue-500/8 blur-3xl dark:bg-blue-500/10" />
              <div className="absolute -bottom-20 left-1/4 h-40 w-[40%] rounded-full bg-violet-500/8 blur-3xl dark:bg-violet-500/10" />
            </div>
            <div className="relative">
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
                Ready to simplify your access control?
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[15px] text-zinc-500 dark:text-zinc-400">
                Get up and running in under 5 minutes. One provider, one config, total control.
              </p>
              <div className="mt-8 flex justify-center gap-3">
                <Button asChild>
                  <Link href="/docs/quickstart">
                    Quick Start
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="secondary" asChild>
                  <Link href="/playground">Try Playground</Link>
                </Button>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>
    </>
  );
}
