import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { defineAccess, AccessProvider, Can, useAccess, usePolicy, useRole, createAuditLoggerPlugin, } from 'react-access-engine';
// ---------------------------------------------------------------------------
// Config — ABAC policies with condition-based access control
// ---------------------------------------------------------------------------
// Demonstrates attribute-based access control where permissions depend on
// runtime context: who the user is, what resource they're acting on, and
// the current environment.
// ---------------------------------------------------------------------------
const config = defineAccess({
    roles: ['admin', 'manager', 'employee'],
    permissions: {
        admin: ['*'],
        manager: [
            'documents:read',
            'documents:write',
            'documents:delete',
            'reports:read',
            'team:manage',
        ],
        employee: ['documents:read', 'documents:write', 'reports:read'],
    },
    policies: [
        // Owner-only editing: users can only edit their own documents
        {
            id: 'owner-edit',
            effect: 'allow',
            permissions: ['documents:write'],
            condition: ({ user, resource }) => resource?.ownerId === user.id,
            description: 'Users can only edit documents they own',
        },
        // Manager approval: managers can edit any document in their department
        {
            id: 'manager-department',
            effect: 'allow',
            permissions: ['documents:write', 'documents:delete'],
            roles: ['manager'],
            condition: ({ user, resource }) => user.attributes?.department === resource?.department,
            priority: 10,
            description: 'Managers can edit/delete documents in their department',
        },
        // Deny deletion for non-admins on archived documents
        {
            id: 'no-delete-archived',
            effect: 'deny',
            permissions: ['documents:delete'],
            condition: ({ resource }) => resource?.status === 'archived',
            priority: 20,
            description: 'Nobody (except admin) can delete archived documents',
        },
        // Environment-based: restrict sensitive reports to production only
        {
            id: 'production-reports',
            effect: 'allow',
            permissions: ['reports:sensitive'],
            environments: ['production'],
            description: 'Sensitive reports only available in production',
        },
    ],
    plans: ['free', 'pro'],
    plugins: [createAuditLoggerPlugin({ deniedOnly: true })],
    debug: true,
});
const documents = [
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
const card = {
    padding: 16,
    borderRadius: 8,
    border: '1px solid #e0e0e0',
    marginBottom: 12,
};
function PolicyCheck({ permission, resource, label, }) {
    const { allowed, matchedRule, reason } = usePolicy(permission, resource);
    return (_jsxs("div", { style: {
            ...card,
            background: allowed ? '#e8f5e9' : '#ffebee',
            borderColor: allowed ? '#a5d6a7' : '#ef9a9a',
        }, children: [_jsx("strong", { children: label }), _jsxs("div", { style: { fontSize: 14, marginTop: 4 }, children: [allowed ? '✅ Allowed' : '❌ Denied', matchedRule && _jsxs("span", { style: { color: '#666', marginLeft: 8 }, children: ["via: ", matchedRule] }), reason && _jsxs("span", { style: { color: '#999', marginLeft: 8 }, children: ["(", reason, ")"] })] })] }));
}
function DocumentCard({ doc, currentUserId: _currentUserId, }) {
    const _resource = {
        ownerId: doc.ownerId,
        department: doc.department,
        status: doc.status,
    };
    return (_jsxs("div", { style: { ...card, background: '#fafafa' }, children: [_jsx("h3", { style: { margin: '0 0 8px' }, children: doc.title }), _jsxs("div", { style: { fontSize: 13, color: '#666', marginBottom: 8 }, children: ["Owner: ", doc.ownerId, " | Dept: ", doc.department, " | Status: ", doc.status] }), _jsx(Can, { perform: "documents:read", children: _jsx("span", { style: { color: '#4caf50', marginRight: 8 }, children: "\uD83D\uDCC4 Read" }) }), _jsx(Can, { perform: "documents:write", fallback: _jsx("span", { style: { color: '#999', marginRight: 8 }, children: "\uD83D\uDD12 Edit" }), children: _jsx("span", { style: { color: '#2196f3', marginRight: 8 }, children: "\u270F\uFE0F Edit" }) }), _jsx(Can, { perform: "documents:delete", fallback: _jsx("span", { style: { color: '#999' }, children: "\uD83D\uDD12 Delete" }), children: _jsx("span", { style: { color: '#f44336' }, children: "\uD83D\uDDD1\uFE0F Delete" }) })] }));
}
function PolicyDashboard() {
    const { user, roles } = useAccess();
    const { hasRole: _hasRole } = useRole();
    return (_jsxs("div", { children: [_jsxs("div", { style: { ...card, background: '#e3f2fd' }, children: [_jsx("h3", { style: { margin: '0 0 8px' }, children: "Current User" }), _jsxs("p", { style: { margin: 0 }, children: ["ID: ", _jsx("strong", { children: user.id }), " | Roles: ", _jsx("strong", { children: roles.join(', ') }), user.attributes?.department ? (_jsxs(_Fragment, { children: [' ', "| Department: ", _jsx("strong", { children: String(user.attributes.department) })] })) : null] })] }), _jsx("h2", { children: "Policy Evaluation Results" }), _jsx(PolicyCheck, { permission: "documents:write", resource: { ownerId: user.id, department: user.attributes?.department }, label: "Edit own document" }), _jsx(PolicyCheck, { permission: "documents:write", resource: { ownerId: 'someone-else', department: user.attributes?.department }, label: "Edit someone else's document (same department)" }), _jsx(PolicyCheck, { permission: "documents:write", resource: { ownerId: 'someone-else', department: 'other-dept' }, label: "Edit document in another department" }), _jsx(PolicyCheck, { permission: "documents:delete", resource: { ownerId: user.id, department: user.attributes?.department, status: 'archived' }, label: "Delete archived document" }), _jsx(PolicyCheck, { permission: "documents:delete", resource: { ownerId: user.id, department: user.attributes?.department, status: 'draft' }, label: "Delete draft document" }), _jsx("h2", { children: "Documents" }), documents.map((doc) => (_jsx(DocumentCard, { doc: doc, currentUserId: user.id }, doc.id)))] }));
}
const users = [
    { id: 'emp-1', label: 'Employee (Sales)', roles: ['employee'], department: 'sales' },
    { id: 'mgr-1', label: 'Manager (Engineering)', roles: ['manager'], department: 'engineering' },
    { id: 'mgr-2', label: 'Manager (Sales)', roles: ['manager'], department: 'sales' },
    { id: 'admin-1', label: 'Admin', roles: ['admin'], department: 'engineering' },
];
export function App() {
    const [userIdx, setUserIdx] = useState(0);
    const profile = users[userIdx];
    const user = {
        id: profile.id,
        roles: profile.roles,
        attributes: { department: profile.department },
    };
    return (_jsxs("div", { style: { fontFamily: 'system-ui', maxWidth: 750, margin: '0 auto', padding: 24 }, children: [_jsx("h1", { children: "ABAC Policies Example" }), _jsx("p", { children: "Switch users to see how attribute-based policies change access. Policies evaluate ownership, department membership, document status, and more." }), _jsxs("label", { style: { display: 'block', marginBottom: 24 }, children: ["User:", ' ', _jsx("select", { value: userIdx, onChange: (e) => setUserIdx(Number(e.target.value)), children: users.map((u, i) => (_jsx("option", { value: i, children: u.label }, u.id))) })] }), _jsx(AccessProvider, { config: config, user: user, children: _jsx(PolicyDashboard, {}) })] }));
}
//# sourceMappingURL=App.js.map