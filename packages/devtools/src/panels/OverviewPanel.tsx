'use client';

import React from 'react';
import type { DevtoolsSnapshot } from '../types';
import * as S from '../styles';

interface OverviewPanelProps {
  snapshot: DevtoolsSnapshot;
}

export function OverviewPanel({ snapshot }: OverviewPanelProps): React.ReactElement {
  return React.createElement(
    'div',
    null,
    // Stats grid
    React.createElement(
      'div',
      { style: S.statGrid },
      React.createElement(
        'div',
        { style: S.statCard },
        React.createElement('div', { style: S.statValue }, String(snapshot.roleCount)),
        React.createElement('div', { style: S.statLabel }, 'Roles'),
      ),
      React.createElement(
        'div',
        { style: S.statCard },
        React.createElement('div', { style: S.statValue }, String(snapshot.permissionCount)),
        React.createElement('div', { style: S.statLabel }, 'Permissions'),
      ),
      React.createElement(
        'div',
        { style: S.statCard },
        React.createElement('div', { style: S.statValue }, String(snapshot.featureCount)),
        React.createElement('div', { style: S.statLabel }, 'Features'),
      ),
      React.createElement(
        'div',
        { style: S.statCard },
        React.createElement('div', { style: S.statValue }, String(snapshot.experiments.length)),
        React.createElement('div', { style: S.statLabel }, 'Experiments'),
      ),
    ),

    // User info
    React.createElement('div', { style: S.sectionHeading }, 'User'),
    React.createElement(
      'div',
      { style: S.card },
      React.createElement(
        'div',
        { style: S.kvRow },
        React.createElement('span', { style: S.kvKey }, 'id'),
        React.createElement('span', { style: S.kvValue }, snapshot.userId),
      ),
      snapshot.plan &&
        React.createElement(
          'div',
          { style: S.kvRow },
          React.createElement('span', { style: S.kvKey }, 'plan'),
          React.createElement('span', { style: S.kvValue }, snapshot.plan),
        ),
      React.createElement(
        'div',
        { style: S.kvRow },
        React.createElement('span', { style: S.kvKey }, 'debug'),
        React.createElement(
          'span',
          { style: S.badge(snapshot.debugEnabled ? 'success' : 'warn') },
          snapshot.debugEnabled ? 'ON' : 'OFF',
        ),
      ),
    ),

    // Roles
    React.createElement('div', { style: S.sectionHeading }, 'Roles'),
    React.createElement(
      'div',
      { style: S.pillContainer },
      ...snapshot.roles.map((role) =>
        React.createElement('span', { key: role, style: S.pill }, role),
      ),
    ),

    // Permissions
    React.createElement('div', { style: S.sectionHeading }, 'Permissions'),
    snapshot.permissions.length > 0
      ? React.createElement(
          'div',
          { style: S.pillContainer },
          ...snapshot.permissions.map((p) =>
            React.createElement('span', { key: p, style: S.pill }, p),
          ),
        )
      : React.createElement('div', { style: S.emptyState }, 'No permissions resolved'),

    // Attributes
    snapshot.attributes &&
      Object.keys(snapshot.attributes).length > 0 &&
      React.createElement(
        React.Fragment,
        null,
        React.createElement('div', { style: S.sectionHeading }, 'Attributes'),
        React.createElement(
          'div',
          { style: S.card },
          ...Object.entries(snapshot.attributes).map(([k, v]) =>
            React.createElement(
              'div',
              { key: k, style: S.kvRow },
              React.createElement('span', { style: S.kvKey }, k),
              React.createElement('span', { style: S.kvValue }, String(v)),
            ),
          ),
        ),
      ),
  );
}
