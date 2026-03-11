import Link from 'next/link';
import { Shield } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-zinc-100 dark:border-zinc-800/50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white"
            >
              <Shield className="h-4 w-4 text-blue-600" />
              react-access-engine
            </Link>
            <p className="mt-2.5 text-[13px] leading-relaxed text-zinc-400 dark:text-zinc-500">
              Unified access control for React.
            </p>
          </div>

          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Docs</h3>
            <ul className="mt-2.5 space-y-1.5">
              {[
                { label: 'Introduction', href: '/docs' },
                { label: 'Installation', href: '/docs/installation' },
                { label: 'API Reference', href: '/docs/api-reference' },
                { label: 'Examples', href: '/docs/examples' },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[13px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Community</h3>
            <ul className="mt-2.5 space-y-1.5">
              <li><a href="https://github.com/abhishekayu/react-access-engine" target="_blank" rel="noopener noreferrer" className="text-[13px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">GitHub</a></li>
              <li><a href="https://github.com/abhishekayu/react-access-engine/discussions" target="_blank" rel="noopener noreferrer" className="text-[13px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">Discussions</a></li>
              <li><Link href="/changelog" className="text-[13px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">Changelog</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">More</h3>
            <ul className="mt-2.5 space-y-1.5">
              <li><Link href="/playground" className="text-[13px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">Playground</Link></li>
              <li><a href="https://www.npmjs.com/package/react-access-engine" target="_blank" rel="noopener noreferrer" className="text-[13px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">npm</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-zinc-100 pt-5 dark:border-zinc-800/50">
          <p className="text-center text-[12px] text-zinc-400 dark:text-zinc-600">
            Released under the MIT License.
          </p>
        </div>
      </div>
    </footer>
  );
}
