'use client';

import React from 'react';
import { AccessProvider } from 'react-access-control';
import { accessConfig } from '@/access-config';

export function AccessWrapper({ children }: { children: React.ReactNode }) {
  // In a real app, this user would come from your auth provider (NextAuth, Clerk, etc.)
  const user = {
    id: 'user-1',
    roles: ['member'] as const,
    plan: 'pro' as const,
  };

  return (
    <AccessProvider config={accessConfig} user={user}>
      {children}
    </AccessProvider>
  );
}
