'use client';

import React from 'react';
import { Can, Feature, useAccess, useRole, usePlan } from 'react-access-engine';

export default function Home() {
  const { roles, permissions } = useAccess();
  const { hasRole } = useRole();
  const { plan } = usePlan();

  return (
    <main style={{ maxWidth: 700, margin: '0 auto' }}>
      <h1>Next.js + react-access-engine</h1>

      <section>
        <h2>Current User</h2>
        <p>
          <strong>Roles:</strong> {roles.join(', ')}
        </p>
        <p>
          <strong>Plan:</strong> {plan ?? 'none'}
        </p>
        <p>
          <strong>Permissions:</strong> {permissions.join(', ')}
        </p>
        <p>Is admin: {hasRole('admin') ? '✅' : '❌'}</p>
      </section>

      <section>
        <h2>Gated Sections</h2>

        <Can perform="posts:write" fallback={<p>🔒 You cannot create posts.</p>}>
          <div style={{ padding: 12, background: '#e8f5e9', borderRadius: 4, marginBottom: 12 }}>
            ✅ Post editor (requires posts:write)
          </div>
        </Can>

        <Can perform="dashboard:view" fallback={<p>🔒 No dashboard access.</p>}>
          <div style={{ padding: 12, background: '#e3f2fd', borderRadius: 4, marginBottom: 12 }}>
            ✅ Dashboard panel (requires dashboard:view)
          </div>
        </Can>

        <Feature name="ai-assistant" fallback={<p>🔒 AI Assistant is admin-only.</p>}>
          <div style={{ padding: 12, background: '#fce4ec', borderRadius: 4, marginBottom: 12 }}>
            🤖 AI Assistant (admin-only feature)
          </div>
        </Feature>

        <Feature name="new-dashboard">
          <div style={{ padding: 12, background: '#fff3e0', borderRadius: 4, marginBottom: 12 }}>
            ✅ New Dashboard feature is enabled!
          </div>
        </Feature>
      </section>
    </main>
  );
}
