import React, { useState } from 'react';
import {
  defineAccess,
  AccessProvider,
  Can,
  useAccess,
  usePolicy,
  useRole,
  createAuditLoggerPlugin,
} from 'react-access-control';

// ---------------------------------------------------------------------------
// Config — ABAC policies with condition-based access control
// ---------------------------------------------------------------------------
// Demonstrates attribute-based access control where permissions depend on
// runtime context: who the user is, what resource they're acting on, and
// the current environment.
// ---------------------------------------------------------------------------

const config = defineAccess({
  roles: ['admin', 'manager', 'employee'] as const,
  permissions: {
    admin: ['*'] as const,
    manager: [
      'documents:read',
      'documents:write',
      'documents:delete',
      'reports:read',
      'team:manage',
    ] as const,
    employee: ['documents:read', 'documents:write', 'reports:read'] as const,
  },
  policies: [
    // Owner-only editing: users can only edit their own documents
    {
      id: 'owner-edit',
      effect: 'allow' as const,
      permissions: ['documents:write'],
      condition: ({ user, resource }) => resource?.ownerId === user.id,
      description: 'Users can only edit documents they own',
    },
    // Manager approval: managers can edit any document in their department
    {
      id: 'manager-department',
      effect: 'allow' as const,
      permissions: ['documents:write', 'documents:delete'],
      roles: ['manager'],
      condition: ({ user, resource }) =>
        (user.attributes?.department as string) === (resource?.department as string),
      priority: 10,
      description: 'Managers can edit/delete documents in their department',
    },
    // Deny deletion for non-admins on archived documents
    {
      id: 'no-delete-archived',
      effect: 'deny' as const,
      permissions: ['documents:delete'],
      condition: ({ resource }) => resource?.status === 'archived',
      priority: 20,
      description: 'Nobody (except admin) can delete archived documents',
    },
    // Environment-based: restrict sensitive reports to production only
    {
      id: 'production-reports',
      effect: 'allow' as const,
      permissions: ['reports:sensitive'],
      environments: ['production'],
      description: 'Sensitive reports only available in production',
    },
  ],
  plans: ['free', 'pro'] as const,
  plugins: [createAuditLoggerPlugin({ deniedOnly: true })],
  debug: true,
});

// ---------------------------------------------------------------------------
// Sample documents
// ---------------------------------------------------------------------------
interface Document {
  id: string;
  title: string;
  ownerId: string;
  department: string;
  status: 'draft' | 'published' | 'archived';
}

const documents: Document[] = [
  { id: 'doc-1', title: 'Q4 Revenue Plan', ownerId: 'emp-1', department: 'sales', status: 'draft' },
  {
    id: 'doc-2',
    title: 'Product Roadmap',
    ownerId: 'mgr-1',
    department: 'engineering',
    status: 'published',
  },
  { id: 'doc-3', title: 'Old Policy', ownerId: 'emp-1', department: 'sales', status: 'archived' },
  {
    id: 'doc-4',
    title: 'Marketing Brief',
    ownerId: 'emp-2',
    department: 'marketing',
    status: 'draft',
  },
];

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

const card: React.CSSProperties = {
  padding: 16,
  borderRadius: 8,
  border: '1px solid #e0e0e0',
  marginBottom: 12,
};

function PolicyCheck({
  permission,
  resource,
  label,
}: {
  permission: string;
  resource: Record<string, unknown>;
  label: string;
}) {
  const { allowed, matchedRule, reason } = usePolicy(permission, resource);
  return (
    <div
      style={{
        ...card,
        background: allowed ? '#e8f5e9' : '#ffebee',
        borderColor: allowed ? '#a5d6a7' : '#ef9a9a',
      }}
    >
      <strong>{label}</strong>
      <div style={{ fontSize: 14, marginTop: 4 }}>
        {allowed ? '✅ Allowed' : '❌ Denied'}
        {matchedRule && <span style={{ color: '#666', marginLeft: 8 }}>via: {matchedRule}</span>}
        {reason && <span style={{ color: '#999', marginLeft: 8 }}>({reason})</span>}
      </div>
    </div>
  );
}

function DocumentCard({
  doc,
  currentUserId: _currentUserId,
}: {
  doc: Document;
  currentUserId: string;
}) {
  const _resource = {
    ownerId: doc.ownerId,
    department: doc.department,
    status: doc.status,
  };

  return (
    <div style={{ ...card, background: '#fafafa' }}>
      <h3 style={{ margin: '0 0 8px' }}>{doc.title}</h3>
      <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
        Owner: {doc.ownerId} | Dept: {doc.department} | Status: {doc.status}
      </div>

      <Can perform="documents:read">
        <span style={{ color: '#4caf50', marginRight: 8 }}>📄 Read</span>
      </Can>

      <Can
        perform="documents:write"
        fallback={<span style={{ color: '#999', marginRight: 8 }}>🔒 Edit</span>}
      >
        <span style={{ color: '#2196f3', marginRight: 8 }}>✏️ Edit</span>
      </Can>

      <Can perform="documents:delete" fallback={<span style={{ color: '#999' }}>🔒 Delete</span>}>
        <span style={{ color: '#f44336' }}>🗑️ Delete</span>
      </Can>
    </div>
  );
}

function PolicyDashboard() {
  const { user, roles } = useAccess();
  const { hasRole: _hasRole } = useRole();

  return (
    <div>
      <div style={{ ...card, background: '#e3f2fd' }}>
        <h3 style={{ margin: '0 0 8px' }}>Current User</h3>
        <p style={{ margin: 0 }}>
          ID: <strong>{user.id}</strong> | Roles: <strong>{roles.join(', ')}</strong>
          {user.attributes?.department && (
            <>
              {' '}
              | Department: <strong>{user.attributes.department as string}</strong>
            </>
          )}
        </p>
      </div>

      <h2>Policy Evaluation Results</h2>

      <PolicyCheck
        permission="documents:write"
        resource={{ ownerId: user.id, department: user.attributes?.department }}
        label="Edit own document"
      />

      <PolicyCheck
        permission="documents:write"
        resource={{ ownerId: 'someone-else', department: user.attributes?.department }}
        label="Edit someone else's document (same department)"
      />

      <PolicyCheck
        permission="documents:write"
        resource={{ ownerId: 'someone-else', department: 'other-dept' }}
        label="Edit document in another department"
      />

      <PolicyCheck
        permission="documents:delete"
        resource={{ ownerId: user.id, department: user.attributes?.department, status: 'archived' }}
        label="Delete archived document"
      />

      <PolicyCheck
        permission="documents:delete"
        resource={{ ownerId: user.id, department: user.attributes?.department, status: 'draft' }}
        label="Delete draft document"
      />

      <h2>Documents</h2>
      {documents.map((doc) => (
        <DocumentCard key={doc.id} doc={doc} currentUserId={user.id} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// App with user switcher
// ---------------------------------------------------------------------------

type UserProfile = {
  id: string;
  label: string;
  roles: readonly ('admin' | 'manager' | 'employee')[];
  department: string;
};

const users: UserProfile[] = [
  { id: 'emp-1', label: 'Employee (Sales)', roles: ['employee'], department: 'sales' },
  { id: 'mgr-1', label: 'Manager (Engineering)', roles: ['manager'], department: 'engineering' },
  { id: 'mgr-2', label: 'Manager (Sales)', roles: ['manager'], department: 'sales' },
  { id: 'admin-1', label: 'Admin', roles: ['admin'], department: 'engineering' },
];

export function App() {
  const [userIdx, setUserIdx] = useState(0);
  const profile = users[userIdx]!;

  const user = {
    id: profile.id,
    roles: profile.roles,
    attributes: { department: profile.department },
  };

  return (
    <div style={{ fontFamily: 'system-ui', maxWidth: 750, margin: '0 auto', padding: 24 }}>
      <h1>ABAC Policies Example</h1>
      <p>
        Switch users to see how attribute-based policies change access. Policies evaluate ownership,
        department membership, document status, and more.
      </p>

      <label style={{ display: 'block', marginBottom: 24 }}>
        User:{' '}
        <select value={userIdx} onChange={(e) => setUserIdx(Number(e.target.value))}>
          {users.map((u, i) => (
            <option key={u.id} value={i}>
              {u.label}
            </option>
          ))}
        </select>
      </label>

      <AccessProvider config={config} user={user}>
        <PolicyDashboard />
      </AccessProvider>
    </div>
  );
}
