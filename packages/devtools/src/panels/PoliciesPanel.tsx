'use client';

import React from 'react';
import type { DevtoolsLogEntry } from '../types';
import * as S from '../styles';

interface PoliciesPanelProps {
  entries: DevtoolsLogEntry[];
  filter: string;
}

export function PoliciesPanel({ entries, filter }: PoliciesPanelProps): React.ReactElement {
  let policyEntries = entries.filter((e) => e.type === 'policy-eval');

  if (filter) {
    const q = filter.toLowerCase();
    policyEntries = policyEntries.filter(
      (e) =>
        e.summary.key.toLowerCase().includes(q) ||
        (e.summary.reason?.toLowerCase().includes(q) ?? false),
    );
  }

  const reversed = [...policyEntries].reverse();

  const allowed = policyEntries.filter((e) => e.summary.result === 'allow').length;
  const denied = policyEntries.filter((e) => e.summary.result === 'deny').length;

  return React.createElement(
    'div',
    null,
    React.createElement(
      'div',
      {
        style: { display: 'flex', gap: 12, marginBottom: 12 },
      },
      React.createElement(
        'div',
        { style: { display: 'flex', alignItems: 'center', gap: 4 } },
        React.createElement('span', { style: S.badge('success') }, String(allowed)),
        React.createElement('span', { style: { fontSize: 11, color: '#94a3b8' } }, 'allowed'),
      ),
      React.createElement(
        'div',
        { style: { display: 'flex', alignItems: 'center', gap: 4 } },
        React.createElement('span', { style: S.badge('error') }, String(denied)),
        React.createElement('span', { style: { fontSize: 11, color: '#94a3b8' } }, 'denied'),
      ),
    ),

    reversed.length === 0
      ? React.createElement('div', { style: S.emptyState }, 'No policy evaluations recorded')
      : React.createElement(
          React.Fragment,
          null,
          ...reversed.slice(0, 50).map((entry) =>
            React.createElement(
              'div',
              { key: entry.id, style: S.logEntry('policy-eval') },
              React.createElement(
                'div',
                { style: S.entryHeader },
                React.createElement('span', { style: S.entryKey }, entry.summary.key),
                React.createElement(
                  'span',
                  {
                    style: S.badge(entry.summary.result === 'allow' ? 'success' : 'error'),
                  },
                  entry.summary.result,
                ),
              ),
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
                `rule: ${entry.summary.reason ?? 'none'}`,
                entry.summary.reasonCode ? ` | code: ${entry.summary.reasonCode}` : '',
              ),
              (entry.data as Record<string, unknown>).matchedPolicy != null &&
                React.createElement(
                  'div',
                  {
                    style: {
                      fontSize: 11,
                      color: '#a855f7',
                      marginTop: 2,
                      fontFamily: "'JetBrains Mono', monospace",
                    },
                  },
                  `policy: ${String((entry.data as Record<string, unknown>).matchedPolicy)}`,
                ),
            ),
          ),
        ),
  );
}
