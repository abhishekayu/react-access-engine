'use client';

import React from 'react';
import { useExperiment } from '../hooks/useExperiment';

export interface ExperimentProps {
  /** Experiment identifier */
  id: string;
  /** Map of variant name → React content */
  variants: Record<string, React.ReactNode>;
  /** Fallback content if experiment is inactive or variant not found */
  fallback?: React.ReactNode;
}

/**
 * A/B testing component. Renders the assigned variant's content.
 *
 * @example
 * ```tsx
 * <Experiment
 *   id="checkout-redesign"
 *   variants={{
 *     control: <CheckoutA />,
 *     'variant-b': <CheckoutB />,
 *     'variant-c': <CheckoutC />,
 *   }}
 *   fallback={<CheckoutA />}
 * />
 * ```
 */
export function Experiment({
  id,
  variants,
  fallback = null,
}: ExperimentProps): React.ReactElement | null {
  const { variant, active } = useExperiment(id);

  if (!active) {
    return React.createElement(React.Fragment, null, fallback);
  }

  const content = variants[variant];
  return React.createElement(React.Fragment, null, content ?? fallback);
}
