'use client';

import React from 'react';
import type { DevtoolsLogEntry } from '../types';
import * as S from '../styles';

interface AccessPanelProps {
  entries: DevtoolsLogEntry[];
  filter: string;
}

export function AccessPanel({ entries, filter }: AccessPanelProps): React.ReactElement {
  let checks = entries.filter((e) => e.type === 'access-check');

  if (filter) {
    const q = filter.toLowerCase();
    checks = checks.filter(
      (e) =>
        e.summary.key.toLowerCase().includes(q) ||
        (e.summary.reason?.toLowerCase().includes(q) ?? false),
    );
  }

  const reversed = [...checks].reverse();

  // Group stats
  const granted = checks.filter((c) => c.summary.result === 'granted').length;
  const denied = checks.filter((c) => c.summary.result === 'denied').length;

  return React.createElement(
    'div',
    null,
    // Summary bar
    React.createElement(
      'div',
      {
        style: { display: 'flex', gap: 12, marginBottom: 12 },
      },
      React.createElement(
        'div',
        { style: { display: 'flex', alignItems: 'center', gap: 4 } },
        React.createElement('span', { style: S.badge('success') }, String(granted)),
        React.createElement('span', { style: { fontSize: 11, color: '#94a3b8' } }, 'granted'),
      ),
      React.createElement(
        'div',
        { style: { display: 'flex', alignItems: 'center', gap: 4 } },
        React.createElement('span', { style: S.badge('error') }, String(denied)),
        React.createElement('span', { style: { fontSize: 11, color: '#94a3b8' } }, 'denied'),
      ),
    ),

    reversed.length === 0
      ? React.createElement('div', { style: S.emptyState }, 'No access checks recorded')
      : React.createElement(
          React.Fragment,
          null,
          ...reversed.slice(0, 50).map((entry) =>
            React.createElement(
              'div',
              { key: entry.id, style: S.logEntry('access-check') },
              React.createElement(
                'div',
                { style: S.entryHeader },
                React.createElement('span', { style: S.entryKey }, entry.summary.key),
                React.createElement(
                  'span',
                  {
                    style: S.badge(entry.summary.result === 'granted' ? 'success' : 'error'),
                  },
                  entry.summary.result,
                ),
              ),
              entry.summary.reason &&
                React.createElement(
                  'div',
                  {
                    style: {
                      fontSize: 11,
                      color: '#94a3b8',
                      marginTop: 2,
                      fontFamily: "'JetBrains Mono', monospace",
                    },
                  },
                  entry.summary.reason,
                ),
            ),
          ),
        ),
  );
}
