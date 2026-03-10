'use client';

import { defineAccess } from 'react-access-engine';

export const accessConfig = defineAccess({
  roles: ['admin', 'member', 'guest'] as const,
  permissions: {
    admin: ['*'] as const,
    member: ['dashboard:view', 'profile:edit', 'posts:read', 'posts:write'] as const,
    guest: ['posts:read'] as const,
  },
  features: {
    'new-dashboard': { enabled: true },
    'ai-assistant': { enabled: true, allowedRoles: ['admin'] },
  },
  plans: ['free', 'pro', 'team'] as const,
});
