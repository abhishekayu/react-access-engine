'use client';

import { useContext } from 'react';
import { AccessContext, type AccessContextValue } from '../context';

/**
 * Internal hook to access the context. Throws if used outside AccessProvider.
 */
export function useAccessContext(): AccessContextValue {
  const ctx = useContext(AccessContext);
  if (!ctx) {
    throw new Error(
      '[react-access-control] useAccess* hooks must be used within an <AccessProvider>. ' +
        'Wrap your app with <AccessProvider config={config} user={user}>.',
    );
  }
  return ctx;
}
