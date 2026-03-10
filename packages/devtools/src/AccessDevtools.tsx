'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDevtoolsContext, useDebugLog, useDevtoolsSnapshot } from './hooks';
import type { DevtoolsTab, DevtoolsPosition } from './types';
import { OverviewPanel } from './panels/OverviewPanel';
import { FeaturesPanel } from './panels/FeaturesPanel';
import { ExperimentsPanel } from './panels/ExperimentsPanel';
import { LogPanel } from './panels/LogPanel';
import { AccessPanel } from './panels/AccessPanel';
import { PoliciesPanel } from './panels/PoliciesPanel';
import * as S from './styles';

declare const process: { env: Record<string, string | undefined> } | undefined;

// ---------------------------------------------------------------------------
// AccessDevtools
// ---------------------------------------------------------------------------
// Development-only floating overlay that visualizes the react-access-control
// system in real time. Shows user state, roles, permissions, feature flags,
// policy evaluations, experiments, and a live event log.
//
// Usage:
//   import { AccessDevtools } from '@react-access-control/devtools';
//   <AccessProvider config={config} user={user}>
//     <App />
//     <AccessDevtools />
//   </AccessProvider>
// ---------------------------------------------------------------------------

export interface AccessDevtoolsProps {
  /** Position of the toggle button and panel */
  position?: DevtoolsPosition;
  /** Start with panel open */
  defaultOpen?: boolean;
  /** Keyboard shortcut to toggle (default: Ctrl+Shift+A / Cmd+Shift+A) */
  shortcut?: string;
  /** Disable the keyboard shortcut */
  disableShortcut?: boolean;
}

const TABS: { id: DevtoolsTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'access', label: 'Access' },
  { id: 'features', label: 'Features' },
  { id: 'policies', label: 'Policies' },
  { id: 'experiments', label: 'Experiments' },
  { id: 'log', label: 'Event Log' },
];

const TYPE_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'access-check', label: 'Access' },
  { value: 'feature-eval', label: 'Feature' },
  { value: 'policy-eval', label: 'Policy' },
];

export function AccessDevtools({
  position = 'bottom-right',
  defaultOpen = false,
  shortcut,
  disableShortcut = false,
}: AccessDevtoolsProps): React.ReactElement | null {
  // Production guard — renders nothing in production
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
    return null;
  }

  return React.createElement(DevtoolsInner, { position, defaultOpen, shortcut, disableShortcut });
}

// Inner component avoids hook calls behind the production guard
function DevtoolsInner({
  position,
  defaultOpen,
  shortcut: _shortcut,
  disableShortcut,
}: Required<Omit<AccessDevtoolsProps, 'shortcut'>> & {
  shortcut?: string;
}): React.ReactElement | null {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [activeTab, setActiveTab] = useState<DevtoolsTab>('overview');
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const panelRef = useRef<HTMLDivElement>(null);

  const ctx = useDevtoolsContext();
  const { entries, clear } = useDebugLog(ctx);
  const snapshot = useDevtoolsSnapshot(ctx);

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  // Keyboard shortcut: Ctrl+Shift+A (or Cmd+Shift+A on Mac)
  useEffect(() => {
    if (disableShortcut) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [disableShortcut]);

  // No provider = show warning
  if (!ctx || !snapshot) {
    return React.createElement(
      'div',
      {
        style: { ...S.container, ...S.positions[position] },
        'data-testid': 'access-devtools',
      },
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: toggle,
          style: S.toggleButton(false),
          title: 'No AccessProvider found',
        },
        '\u{1F512} No Provider',
      ),
    );
  }

  const deniedCount = entries.filter(
    (e) =>
      e.summary.result === 'denied' ||
      e.summary.result === 'deny' ||
      e.summary.result === 'disabled',
  ).length;

  return React.createElement(
    'div',
    {
      style: { ...S.container, ...S.positions[position] },
      'data-testid': 'access-devtools',
    },
    // Panel
    isOpen &&
      React.createElement(
        'div',
        { ref: panelRef, style: S.panel },
        // Header
        React.createElement(
          'div',
          { style: S.header },
          React.createElement(
            'div',
            { style: S.headerTitle },
            React.createElement('span', null, '\u{1F512}'),
            'Access Devtools',
          ),
          React.createElement(
            'div',
            { style: S.headerActions },
            !disableShortcut &&
              React.createElement(
                'span',
                { style: S.kbd },
                navigator.platform?.includes('Mac') ? '\u2318\u21E7A' : 'Ctrl+Shift+A',
              ),
            deniedCount > 0 &&
              React.createElement('span', { style: S.badge('error') }, `${deniedCount} denied`),
          ),
        ),

        // Tab bar
        React.createElement(
          'div',
          { style: S.tabBar },
          ...TABS.map((t) =>
            React.createElement(
              'button',
              {
                key: t.id,
                type: 'button',
                onClick: () => {
                  setActiveTab(t.id);
                  setFilter('');
                },
                style: S.tab(activeTab === t.id),
              },
              t.label,
            ),
          ),
        ),

        // Filter bar (only for tabs that support it)
        activeTab !== 'overview' &&
          React.createElement(
            'div',
            { style: S.filterBar },
            React.createElement('input', {
              type: 'text',
              placeholder: 'Filter...',
              value: filter,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => setFilter(e.target.value),
              style: S.filterInput,
            }),
            activeTab === 'log' &&
              React.createElement(
                React.Fragment,
                null,
                ...TYPE_FILTERS.map((tf) =>
                  React.createElement(
                    'button',
                    {
                      key: tf.value,
                      type: 'button',
                      onClick: () => setTypeFilter(tf.value),
                      style: {
                        ...S.smallButton,
                        color: typeFilter === tf.value ? '#6366f1' : undefined,
                        borderColor: typeFilter === tf.value ? '#6366f1' : undefined,
                      },
                    },
                    tf.label,
                  ),
                ),
              ),
          ),

        // Content area
        React.createElement(
          'div',
          { style: S.content },
          activeTab === 'overview' && React.createElement(OverviewPanel, { snapshot }),
          activeTab === 'access' && React.createElement(AccessPanel, { entries, filter }),
          activeTab === 'features' && React.createElement(FeaturesPanel, { snapshot, filter }),
          activeTab === 'policies' && React.createElement(PoliciesPanel, { entries, filter }),
          activeTab === 'experiments' &&
            React.createElement(ExperimentsPanel, { snapshot, filter }),
          activeTab === 'log' &&
            React.createElement(LogPanel, {
              entries,
              filter,
              typeFilter,
              onClear: clear,
            }),
        ),
      ),

    // Toggle button
    React.createElement(
      'button',
      {
        type: 'button',
        onClick: toggle,
        style: S.toggleButton(isOpen),
        title: isOpen ? 'Close devtools' : 'Open Access Devtools',
      },
      isOpen ? '\u2715' : '\u{1F512} Access',
    ),
  );
}
