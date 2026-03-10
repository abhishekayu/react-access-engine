import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
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
  roles: ['admin', 'editor', 'viewer'],
  permissions: {
    admin: ['*'],
    editor: ['articles:read', 'articles:write', 'comments:read', 'comments:write'],
    viewer: ['articles:read', 'comments:read'],
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
  return _jsxs('div', {
    children: [
      _jsx('h2', { children: 'User Info' }),
      _jsxs('p', { children: [_jsx('strong', { children: 'Roles:' }), ' ', roles.join(', ')] }),
      _jsxs('p', {
        children: [_jsx('strong', { children: 'Permissions:' }), ' ', permissions.join(', ')],
      }),
      _jsxs('p', { children: ['Is admin: ', hasRole('admin') ? '✅ Yes' : '❌ No'] }),
      _jsxs('p', { children: ['Can write articles: ', canWrite ? '✅ Yes' : '❌ No'] }),
      _jsx('h3', { children: 'Gated Content' }),
      _jsx(Can, {
        perform: 'articles:write',
        fallback: _jsx('p', { children: '\uD83D\uDD12 You cannot edit articles.' }),
        children: _jsx('div', {
          style: { padding: 12, background: '#e8f5e9', borderRadius: 4 },
          children: '\u2705 Article editor panel (requires articles:write)',
        }),
      }),
      _jsx(Feature, {
        name: 'dark-mode',
        fallback: _jsx('p', { children: 'Dark mode is disabled.' }),
        children: _jsx('p', { children: '\uD83C\uDF19 Dark mode is enabled!' }),
      }),
    ],
  });
}
export function App() {
  const user = { id: 'user-1', roles: ['editor'] };
  return _jsxs('div', {
    style: { fontFamily: 'system-ui', maxWidth: 600, margin: '0 auto', padding: 24 },
    children: [
      _jsx('h1', { children: 'Basic RBAC Example' }),
      _jsx(AccessProvider, { config: config, user: user, children: _jsx(UserInfo, {}) }),
    ],
  });
}
//# sourceMappingURL=App.js.map
