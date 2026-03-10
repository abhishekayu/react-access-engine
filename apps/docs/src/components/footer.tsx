import Link from 'next/link';
import { Shield } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="flex items-center gap-2 font-bold text-zinc-900 dark:text-white"
            >
              <Shield className="h-5 w-5 text-blue-600" />
              <span>react-access-engine</span>
            </Link>
            <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
              Unified access control for React. RBAC, ABAC, feature flags, experiments — all in one.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Documentation</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/docs"
                  className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                >
                  Introduction
                </Link>
              </li>
              <li>
                <Link
                  href="/docs/installation"
                  className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                >
                  Installation
                </Link>
              </li>
              <li>
                <Link
                  href="/docs/api-reference"
                  className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                >
                  API Reference
                </Link>
              </li>
              <li>
                <Link
                  href="/docs/examples"
                  className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                >
                  Examples
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Community</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <a
                  href="https://github.com/example/react-access-engine"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/example/react-access-engine/discussions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                >
                  Discussions
                </a>
              </li>
              <li>
                <Link
                  href="/changelog"
                  className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                >
                  Changelog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">More</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/playground"
                  className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                >
                  Playground
                </Link>
              </li>
              <li>
                <a
                  href="https://www.npmjs.com/package/react-access-engine"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                >
                  npm
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <p className="text-center text-sm text-zinc-400 dark:text-zinc-500">
            Released under the MIT License. Built with Next.js.
          </p>
        </div>
      </div>
    </footer>
  );
}
