import type { ExperimentDefinition, UserContext } from '../types';
import { hashUserId } from '../utils/hash';

// ---------------------------------------------------------------------------
// Experiment Engine
// ---------------------------------------------------------------------------
// Assigns users to experiment variants deterministically based on user ID.
// Supports percentage-based allocation across variants.
// ---------------------------------------------------------------------------

export interface ExperimentAssignment<TVariant extends string = string> {
  experimentId: string;
  variant: TVariant;
  active: boolean;
}

/**
 * Assign a user to an experiment variant.
 * Uses deterministic hashing so the same user always gets the same variant.
 */
export function assignExperiment<TVariant extends string>(
  experiment: ExperimentDefinition<TVariant>,
  user: UserContext,
): ExperimentAssignment<TVariant> {
  if (!experiment.active) {
    return {
      experimentId: experiment.id,
      variant: experiment.defaultVariant,
      active: false,
    };
  }

  const { variants, allocation, defaultVariant } = experiment;

  // If no allocation specified, distribute evenly
  if (!allocation) {
    const hash = hashUserId(user.id, experiment.id);
    const bucket = hash % variants.length;
    return {
      experimentId: experiment.id,
      variant: variants[bucket] ?? defaultVariant,
      active: true,
    };
  }

  // Percentage-based allocation
  const hash = hashUserId(user.id, experiment.id);
  const bucket = hash % 100;
  let cumulative = 0;

  for (const variant of variants) {
    const pct = allocation[variant] ?? 0;
    cumulative += pct;
    if (bucket < cumulative) {
      return {
        experimentId: experiment.id,
        variant,
        active: true,
      };
    }
  }

  // Fallback to default
  return {
    experimentId: experiment.id,
    variant: defaultVariant,
    active: true,
  };
}
