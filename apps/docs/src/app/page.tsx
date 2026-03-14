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
      <section className="relative mx-auto max-w-3xl px-4 py-24 text-center">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 h-75 w-100 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-400/5 blur-[100px] dark:bg-indigo-500/8" />
        </div>
        <FadeIn>
          <h2 className="relative text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl lg:text-4xl dark:text-white">
            Ready to get started?
          </h2>
          <p className="relative mt-4 text-base text-zinc-500 dark:text-zinc-400">
            One provider, one config, total control.
          </p>
          <div className="relative mt-8 flex justify-center gap-3">
            <Button asChild>
              <Link href="/docs/quickstart">
                Quick Start
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/playground">Playground</Link>
            </Button>
          </div>
        </FadeIn>
      </section>
    </>
  );
}
