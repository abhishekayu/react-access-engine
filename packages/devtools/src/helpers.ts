'use client';

// ---------------------------------------------------------------------------
// Helper APIs for labelling & controlling debug collection
// ---------------------------------------------------------------------------

import React, { createContext, useContext } from 'react';

// ---------------------------------------------------------------------------
// Component labelling
// ---------------------------------------------------------------------------
// Wrap any section of your tree with <DebugLabel name="SomeComponent"> to
// attach that label to devtools log entries generated inside it.
// ---------------------------------------------------------------------------

const LabelContext = createContext<string | undefined>(undefined);

export interface DebugLabelProps {
  /** Human-readable label for this section */
  name: string;
  children: React.ReactNode;
}

/**
 * Labels a section of the component tree for clearer debug output.
 *
 * @example
 * ```tsx
 * <DebugLabel name="Sidebar">
 *   <Can perform="settings:view">
 *     <SettingsLink />
 *   </Can>
 * </DebugLabel>
 * ```
 */
export function DebugLabel({ name, children }: DebugLabelProps): React.ReactElement {
  return React.createElement(LabelContext.Provider, { value: name }, children);
}

/** Read the current debug label (internal) */
export function useDebugLabel(): string | undefined {
  return useContext(LabelContext);
}

// ---------------------------------------------------------------------------
// Debug collection toggle
// ---------------------------------------------------------------------------
// Programmatic API for enabling/disabling debug collection at runtime.
// Useful for conditionally turning on debug in staging or for specific users.
// ---------------------------------------------------------------------------

let _debugEnabled = true;

/** Check if debug collection is currently enabled */
export function isDebugEnabled(): boolean {
  return _debugEnabled;
}

/** Enable debug event collection */
export function enableDebug(): void {
  _debugEnabled = true;
}

/** Disable debug event collection */
export function disableDebug(): void {
  _debugEnabled = false;
}
