export interface NavItem {
  title: string;
  href: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const docsNavigation: NavSection[] = [
  {
    title: 'Getting Started',
    items: [
      { title: 'Introduction', href: '/docs' },
      { title: 'Installation', href: '/docs/installation' },
      { title: 'Quick Start', href: '/docs/quickstart' },
    ],
  },
  {
    title: 'Core',
    items: [
      { title: 'Core Concepts', href: '/docs/core-concepts' },
      { title: 'API Reference', href: '/docs/api-reference' },
    ],
  },
  {
    title: 'Features',
    items: [
      { title: 'Policies & ABAC', href: '/docs/policies' },
      { title: 'Feature Flags', href: '/docs/feature-flags' },
      { title: 'Rollouts & Segments', href: '/docs/rollouts' },
      { title: 'Experiments', href: '/docs/experiments' },
      { title: 'Remote Config', href: '/docs/remote-config' },
    ],
  },
  {
    title: 'Extensibility',
    items: [
      { title: 'Plugins', href: '/docs/plugins' },
      { title: 'DevTools', href: '/docs/devtools' },
      { title: 'Examples', href: '/docs/examples' },
    ],
  },
];

export const topNavLinks: NavItem[] = [
  { title: 'Docs', href: '/docs' },
  { title: 'Playground', href: '/playground' },
  { title: 'Changelog', href: '/changelog' },
  { title: 'Community', href: '/community' },
];
