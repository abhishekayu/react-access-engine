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

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-16 text-center shadow-2xl sm:px-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to simplify your access control?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-blue-100">
              Get up and running in under 5 minutes. One provider, one config, total control.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button asChild className="bg-white text-blue-700 hover:bg-blue-50">
                <Link href="/docs/quickstart">
                  Quick Start Guide
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                asChild
                className="border border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
              >
                <Link href="/playground">Try the Playground</Link>
              </Button>
            </div>
          </div>
        </FadeIn>
      </section>
    </>
  );
}
