import type { Metadata } from 'next';
import Link from 'next/link';
import { Github, MessageSquare, Heart, BookOpen, Bug } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Community',
  description: 'Join the react-access-engine community — contribute, discuss, and get support.',
};

const links = [
  {
    icon: Github,
    title: 'GitHub Repository',
    description: 'Browse the source code, report issues, and submit PRs.',
    href: 'https://github.com/example/react-access-engine',
    label: 'View on GitHub',
  },
  {
    icon: MessageSquare,
    title: 'Discussions',
    description: 'Ask questions, share ideas, and connect with other users.',
    href: 'https://github.com/example/react-access-engine/discussions',
    label: 'Join Discussions',
  },
  {
    icon: Bug,
    title: 'Report a Bug',
    description: 'Found a bug? Open an issue with reproduction steps.',
    href: 'https://github.com/example/react-access-engine/issues/new',
    label: 'Report Bug',
  },
  {
    icon: BookOpen,
    title: 'Documentation',
    description: 'Read the full docs, guides, and API reference.',
    href: '/docs',
    label: 'Read Docs',
    internal: true,
  },
];

export default function CommunityPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Community</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        react-access-engine is open source and community-driven. Here&apos;s how to get involved.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {links.map((link) => {
          const Wrapper = link.internal ? Link : 'a';
          const externalProps = link.internal
            ? {}
            : { target: '_blank', rel: 'noopener noreferrer' };

          return (
            <Wrapper
              key={link.title}
              href={link.href}
              {...externalProps}
              className="group rounded-xl border border-zinc-200 p-6 transition-all hover:border-blue-300 hover:shadow-lg dark:border-zinc-700 dark:hover:border-blue-700"
            >
              <link.icon className="mb-3 h-6 w-6 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-zinc-900 dark:text-white">{link.title}</h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{link.description}</p>
              <span className="mt-3 inline-block text-sm font-medium text-blue-600 group-hover:underline dark:text-blue-400">
                {link.label} →
              </span>
            </Wrapper>
          );
        })}
      </div>

      {/* Contributing */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Contributing</h2>
        <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
            <p>We welcome contributions of all kinds! Here&apos;s how to get started:</p>
            <ol className="list-decimal space-y-2 pl-5">
              <li>Fork the repository on GitHub</li>
              <li>
                Clone your fork and install dependencies with{' '}
                <code className="rounded bg-zinc-200 px-1 text-xs dark:bg-zinc-800">
                  pnpm install
                </code>
              </li>
              <li>
                Create a feature branch:{' '}
                <code className="rounded bg-zinc-200 px-1 text-xs dark:bg-zinc-800">
                  git checkout -b feature/my-feature
                </code>
              </li>
              <li>Make your changes and add tests</li>
              <li>
                Run the test suite:{' '}
                <code className="rounded bg-zinc-200 px-1 text-xs dark:bg-zinc-800">pnpm test</code>
              </li>
              <li>Submit a pull request</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Sponsor */}
      <div className="mt-12 rounded-xl border border-pink-200 bg-pink-50 p-6 text-center dark:border-pink-900 dark:bg-pink-950/20">
        <Heart className="mx-auto h-8 w-8 text-pink-500" />
        <h3 className="mt-3 text-lg font-semibold text-zinc-900 dark:text-white">
          Sponsor this project
        </h3>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          If react-access-engine saves you time, consider sponsoring the project to support
          continued development.
        </p>
        <a
          href="https://github.com/sponsors/example"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-pink-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-pink-700"
        >
          <Heart className="h-4 w-4" />
          Become a Sponsor
        </a>
      </div>
    </div>
  );
}
