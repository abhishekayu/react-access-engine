import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'react-access-control — Unified Access Control for React',
    template: '%s | react-access-control',
  },
  description:
    'RBAC, ABAC, feature flags, A/B experiments, plan gating, and remote config — all in a single, type-safe, tree-shakeable React package.',
  metadataBase: new URL('https://react-access-control.dev'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'react-access-control',
    title: 'react-access-control — Unified Access Control for React',
    description:
      'RBAC, ABAC, feature flags, A/B experiments, plan gating, and remote config — all in one package.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'react-access-control',
    description: 'Unified access control for React apps.',
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareSourceCode',
  name: 'react-access-control',
  description:
    'Unified RBAC, ABAC, feature flags, A/B experiments, plan gating, and remote config for React.',
  programmingLanguage: 'TypeScript',
  runtimePlatform: 'React',
  codeRepository: 'https://github.com/example/react-access-control',
  license: 'https://opensource.org/licenses/MIT',
  operatingSystem: 'Cross-platform',
  applicationCategory: 'DeveloperApplication',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-white font-sans text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-screen flex-col">
            <Nav />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
