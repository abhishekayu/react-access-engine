'use client';

import React from 'react';
import type { DevtoolsSnapshot } from '../types';
import * as S from '../styles';

interface FeaturesPanelProps {
  snapshot: DevtoolsSnapshot;
  filter: string;
}

export function FeaturesPanel({ snapshot, filter }: FeaturesPanelProps): React.ReactElement {
  const filtered = filter
    ? snapshot.features.filter((f) => f.name.toLowerCase().includes(filter.toLowerCase()))
    : snapshot.features;

  if (filtered.length === 0) {
    return React.createElement(
      'div',
      { style: S.emptyState },
      filter ? 'No features match filter' : 'No features defined',
    );
  }

  return React.createElement(
    'div',
    null,
    ...filtered.map((f) =>
      React.createElement(
        'div',
        { key: f.name, style: S.featureRow },
        React.createElement(
          'div',
          null,
          React.createElement('span', { style: S.featureName }, f.name),
          f.segment &&
            React.createElement(
              'span',
              {
                style: { ...S.badge('info'), marginLeft: 6 },
              },
              f.segment,
            ),
        ),
        React.createElement(
          'div',
          { style: { display: 'flex', alignItems: 'center', gap: 6 } },
          React.createElement(
            'span',
            {
              style: { fontSize: 10, color: '#64748b', fontFamily: "'JetBrains Mono', monospace" },
            },
            f.reason,
          ),
          React.createElement(
            'span',
            {
              style: S.badge(f.enabled ? 'success' : 'error'),
            },
            f.enabled ? 'ON' : 'OFF',
          ),
        ),
      ),
    ),
  );
}
