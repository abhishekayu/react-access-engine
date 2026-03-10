import { describe, it, expect } from 'vitest';
import { assignExperiment } from '../src/engines/experiment-engine';
import type { ExperimentDefinition, UserContext } from '../src/types';

const user: UserContext = { id: 'user-42', roles: ['viewer'] };

describe('Experiment Engine', () => {
  it('returns default variant when experiment is inactive', () => {
    const experiment: ExperimentDefinition = {
      id: 'test-exp',
      variants: ['control', 'variant-a'],
      defaultVariant: 'control',
      active: false,
    };
    const result = assignExperiment(experiment, user);
    expect(result.variant).toBe('control');
    expect(result.active).toBe(false);
  });

  it('assigns a variant deterministically', () => {
    const experiment: ExperimentDefinition = {
      id: 'checkout-test',
      variants: ['control', 'variant-a', 'variant-b'],
      defaultVariant: 'control',
      active: true,
    };
    const result1 = assignExperiment(experiment, user);
    const result2 = assignExperiment(experiment, user);
    expect(result1.variant).toBe(result2.variant);
    expect(result1.active).toBe(true);
  });

  it('assigns different variants to different users', () => {
    const experiment: ExperimentDefinition = {
      id: 'ab-test',
      variants: ['control', 'variant-a'],
      defaultVariant: 'control',
      active: true,
    };

    const variants = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const u: UserContext = { id: `user-${i}`, roles: [] };
      const result = assignExperiment(experiment, u);
      variants.add(result.variant);
    }
    // With 100 users and 2 variants, we should see both
    expect(variants.size).toBe(2);
  });

  it('respects percentage allocation', () => {
    const experiment: ExperimentDefinition<'control' | 'test'> = {
      id: 'alloc-test',
      variants: ['control', 'test'],
      defaultVariant: 'control',
      active: true,
      allocation: { control: 90, test: 10 },
    };

    let controlCount = 0;
    let testCount = 0;
    const total = 1000;

    for (let i = 0; i < total; i++) {
      const u: UserContext = { id: `user-${i}`, roles: [] };
      const result = assignExperiment(experiment, u);
      if (result.variant === 'control') controlCount++;
      else testCount++;
    }

    // With 90/10 split, control should be significantly more (allowing some hash variance)
    expect(controlCount).toBeGreaterThan(testCount);
  });
});
