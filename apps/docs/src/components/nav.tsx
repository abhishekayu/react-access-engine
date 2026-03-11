'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Github, Shield } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { topNavLinks } from '@/lib/navigation';
import { ThemeToggle } from './theme-toggle';
import { SearchDialog, SearchTrigger } from './search-dialog';

export function Nav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200/80 bg-white/90 backdrop-blur-lg dark:border-zinc-800/80 dark:bg-zinc-950/90">
      <SearchDialog />
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-[15px] font-semibold text-zinc-900 dark:text-white"
        >
          <Shield className="h-5 w-5 text-blue-600" />
          <span className="hidden sm:inline">react-access-engine</span>
          <span className="sm:hidden">RAE</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-0.5 md:flex">
          {topNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors',
                pathname.startsWith(link.href)
                  ? 'text-zinc-900 dark:text-white'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white',
              )}
            >
              {link.title}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1">
          <SearchTrigger />
          <a
            href="https://github.com/abhishekayu/react-access-engine"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            aria-label="GitHub"
          >
            <Github className="h-[18px] w-[18px]" />
          </a>
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 md:hidden dark:text-zinc-400"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="border-t border-zinc-100 bg-white px-4 py-3 md:hidden dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex flex-col space-y-0.5">
            {topNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'rounded-md px-3 py-2 text-[13px] font-medium transition-colors',
                  pathname.startsWith(link.href)
                    ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white'
                    : 'text-zinc-500 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900',
                )}
              >
                {link.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
