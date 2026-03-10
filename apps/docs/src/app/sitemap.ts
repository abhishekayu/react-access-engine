import type { MetadataRoute } from 'next';

const BASE_URL = 'https://react-access-control.dev';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    '',
    '/docs',
    '/docs/installation',
    '/docs/quickstart',
    '/docs/core-concepts',
    '/docs/api-reference',
    '/docs/policies',
    '/docs/feature-flags',
    '/docs/rollouts',
    '/docs/experiments',
    '/docs/remote-config',
    '/docs/plugins',
    '/docs/devtools',
    '/docs/examples',
    '/playground',
    '/changelog',
    '/community',
  ];

  return staticPages.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '/changelog' ? 'weekly' : 'monthly',
    priority: path === '' ? 1.0 : path === '/docs' ? 0.9 : 0.7,
  }));
}
