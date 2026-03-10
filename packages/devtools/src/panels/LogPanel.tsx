'use client';

import React from 'react';
import type { DevtoolsLogEntry } from '../types';
import * as S from '../styles';

interface LogPanelProps {
  entries: DevtoolsLogEntry[];
  filter: string;
  typeFilter: string;
  onClear: () => void;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return (
    d.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) +
    '.' +
    String(d.getMilliseconds()).padStart(3, '0')
  );
}

const typeLabels: Record<string, string> = {
  'access-check': 'ACCESS',
  'feature-eval': 'FEATURE',
  'policy-eval': 'POLICY',
  'experiment-assign': 'EXPERIMENT',
  'render-denied': 'DENIED',
};

export function LogPanel({
  entries,
  filter,
  typeFilter,
  onClear,
}: LogPanelProps): React.ReactElement {
  let filtered = entries;

  if (typeFilter && typeFilter !== 'all') {
    filtered = filtered.filter((e) => e.type === typeFilter);
  }

  if (filter) {
    const q = filter.toLowerCase();
    filtered = filtered.filter(
      (e) =>
        e.summary.key.toLowerCase().includes(q) ||
        (e.summary.reason?.toLowerCase().includes(q) ?? false) ||
        (e.componentLabel?.toLowerCase().includes(q) ?? false),
    );
  }

  // Show newest first
  const reversed = [...filtered].reverse();

  return React.createElement(
    'div',
    null,
    // Toolbar
    React.createElement(
      'div',
      {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        },
      },
      React.createElement(
        'span',
        { style: { fontSize: 11, color: '#94a3b8' } },
        `${filtered.length} event${filtered.length !== 1 ? 's' : ''}`,
      ),
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: onClear,
          style: S.smallButton,
        },
        'Clear',
      ),
    ),

    reversed.length === 0
      ? React.createElement(
          'div',
          { style: S.emptyState },
          filter || typeFilter !== 'all'
            ? 'No events match filter'
            : 'No events recorded yet. Interact with your app to see access decisions.',
        )
      : React.createElement(
          React.Fragment,
          null,
          ...reversed.map((entry) =>
            React.createElement(
              'div',
              { key: entry.id, style: S.logEntry(entry.type) },
              // Header
              React.createElement(
                'div',
                { style: S.entryHeader },
                React.createElement(
                  'div',
                  { style: { display: 'flex', alignItems: 'center', gap: 6 } },
                  React.createElement(
                    'span',
                    { style: S.entryType },
                    typeLabels[entry.type] ?? entry.type,
                  ),
                  entry.componentLabel &&
                    React.createElement('span', { style: S.badge('info') }, entry.componentLabel),
                ),
                React.createElement('span', { style: S.entryTime }, formatTime(entry.timestamp)),
              ),
              // Summary
              React.createElement(
                'div',
                {
                  style: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 },
                },
                React.createElement('span', { style: S.entryKey }, entry.summary.key),
                React.createElement(
                  'span',
                  {
                    style: S.badge(
                      entry.summary.result === 'granted' ||
                        entry.summary.result === 'enabled' ||
                        entry.summary.result === 'allow'
                        ? 'success'
                        : entry.summary.result === 'denied' ||
                            entry.summary.result === 'disabled' ||
                            entry.summary.result === 'deny'
                          ? 'error'
                          : 'info',
                    ),
                  },
                  entry.summary.result,
                ),
              ),
              // Reason
              entry.summary.reason &&
                React.createElement(
                  'div',
                  {
                    style: {
                      marginTop: 4,
                      fontSize: 11,
                      color: '#94a3b8',
                      fontFamily: "'JetBrains Mono', monospace",
                    },
                  },
                  `reason: ${entry.summary.reason}`,
                  entry.summary.reasonCode ? ` (${entry.summary.reasonCode})` : '',
                ),
            ),
          ),
        ),
  );
}
