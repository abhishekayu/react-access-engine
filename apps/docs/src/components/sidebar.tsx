'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { docsNavigation } from '@/lib/navigation';

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 overflow-y-auto border-r border-zinc-200 py-8 pr-4 lg:block dark:border-zinc-800">
      <nav className="space-y-6">
        {docsNavigation.map((section) => (
          <div key={section.title}>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {section.title}
            </h4>
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'block rounded-md px-3 py-1.5 text-sm transition-colors',
                      pathname === item.href
                        ? 'bg-blue-50 font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-400'
                        : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-white',
                    )}
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}

export function MobileSidebar() {
  const pathname = usePathname();

  return (
    <div className="mb-6 overflow-x-auto border-b border-zinc-200 pb-4 lg:hidden dark:border-zinc-800">
      <nav className="flex gap-4 whitespace-nowrap">
        {docsNavigation.flatMap((section) =>
          section.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'text-sm font-medium transition-colors',
                pathname === item.href
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white',
              )}
            >
              {item.title}
            </Link>
          )),
        )}
      </nav>
    </div>
  );
}
