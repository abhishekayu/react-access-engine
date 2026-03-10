import React from 'react';
import {
  defineAccess,
  AccessProvider,
  Can,
  Feature,
  useAccess,
  useRole,
  usePermission,
} from 'react-access-control';

const config = defineAccess({
  roles: ['admin', 'editor', 'viewer'] as const,
  permissions: {
    admin: ['*'] as const,
    editor: ['articles:read', 'articles:write', 'comments:read', 'comments:write'] as const,
    viewer: ['articles:read', 'comments:read'] as const,
  },
  features: {
    'dark-mode': { enabled: true },
    'new-editor': { enabled: false },
  },
});

function UserInfo() {
  const { roles, permissions } = useAccess();
  const { hasRole } = useRole();
  const canWrite = usePermission('articles:write');

  return (
    <div>
      <h2>User Info</h2>
      <p>
        <strong>Roles:</strong> {roles.join(', ')}
      </p>
      <p>
        <strong>Permissions:</strong> {permissions.join(', ')}
      </p>
      <p>Is admin: {hasRole('admin') ? '✅ Yes' : '❌ No'}</p>
      <p>Can write articles: {canWrite ? '✅ Yes' : '❌ No'}</p>

      <h3>Gated Content</h3>
      <Can perform="articles:write" fallback={<p>🔒 You cannot edit articles.</p>}>
        <div style={{ padding: 12, background: '#e8f5e9', borderRadius: 4 }}>
          ✅ Article editor panel (requires articles:write)
        </div>
      </Can>

      <Feature name="dark-mode" fallback={<p>Dark mode is disabled.</p>}>
        <p>🌙 Dark mode is enabled!</p>
      </Feature>
    </div>
  );
}

export function App() {
  const user = { id: 'user-1', roles: ['editor'] as const };

  return (
    <div style={{ fontFamily: 'system-ui', maxWidth: 600, margin: '0 auto', padding: 24 }}>
      <h1>Basic RBAC Example</h1>
      <AccessProvider config={config} user={user}>
        <UserInfo />
      </AccessProvider>
    </div>
  );
}
