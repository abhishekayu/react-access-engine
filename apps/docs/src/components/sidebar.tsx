'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { docsNavigation } from '@/lib/navigation';

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 overflow-y-auto py-8 pr-6 lg:block">
      <nav className="space-y-5">
        {docsNavigation.map((section) => (
          <div key={section.title}>
            <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              {section.title}
            </h4>
            <ul className="space-y-0.5 border-l border-zinc-200 dark:border-zinc-800">
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'block border-l-2 -ml-px py-1 pl-3 text-[13px] transition-colors',
                      pathname === item.href
                        ? 'border-zinc-900 font-medium text-zinc-900 dark:border-white dark:text-white'
                        : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-white',
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
      <nav className="flex gap-3 whitespace-nowrap">
        {docsNavigation.flatMap((section) =>
          section.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'text-[13px] font-medium transition-colors',
                pathname === item.href
                  ? 'text-zinc-900 dark:text-white'
                  : 'text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-white',
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
