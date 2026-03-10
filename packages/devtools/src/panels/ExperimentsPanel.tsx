'use client';

import React from 'react';
import type { DevtoolsSnapshot } from '../types';
import * as S from '../styles';

interface ExperimentsPanelProps {
  snapshot: DevtoolsSnapshot;
  filter: string;
}

export function ExperimentsPanel({ snapshot, filter }: ExperimentsPanelProps): React.ReactElement {
  const filtered = filter
    ? snapshot.experiments.filter((e) => e.id.toLowerCase().includes(filter.toLowerCase()))
    : snapshot.experiments;

  if (filtered.length === 0) {
    return React.createElement(
      'div',
      { style: S.emptyState },
      filter ? 'No experiments match filter' : 'No experiments defined',
    );
  }

  return React.createElement(
    'div',
    null,
    ...filtered.map((e) =>
      React.createElement(
        'div',
        { key: e.id, style: S.card },
        React.createElement(
          'div',
          { style: S.entryHeader },
          React.createElement('span', { style: S.entryKey }, e.id),
          React.createElement(
            'span',
            {
              style: S.badge(e.active ? 'success' : 'warn'),
            },
            e.active ? 'ACTIVE' : 'INACTIVE',
          ),
        ),
        React.createElement(
          'div',
          { style: S.kvRow },
          React.createElement('span', { style: S.kvKey }, 'variant'),
          React.createElement(
            'span',
            {
              style: { ...S.kvValue, color: '#6366f1' },
            },
            e.variant,
          ),
        ),
      ),
    ),
  );
}
