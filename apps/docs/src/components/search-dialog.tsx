'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { docsNavigation, topNavLinks } from '@/lib/navigation';

interface SearchItem {
  title: string;
  href: string;
  section?: string;
}

function getAllSearchItems(): SearchItem[] {
  const items: SearchItem[] = [];
  for (const section of docsNavigation) {
    for (const item of section.items) {
      items.push({ title: item.title, href: item.href, section: section.title });
    }
  }
  for (const link of topNavLinks) {
    if (!items.some((i) => i.href === link.href)) {
      items.push({ title: link.title, href: link.href });
    }
  }
  return items;
}

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const allItems = getAllSearchItems();
  const filtered = query
    ? allItems.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.section?.toLowerCase().includes(query.toLowerCase()),
      )
    : allItems;

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery('');
      router.push(href);
    },
    [router],
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setQuery('');
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      navigate(filtered[selectedIndex].href);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        onKeyDown={() => {}}
        role="presentation"
      />

      {/* Dialog */}
      <div className="fixed left-1/2 top-[15%] w-full max-w-lg -translate-x-1/2 rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
          <Search className="h-4 w-4 shrink-0 text-zinc-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search documentation..."
            className="flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-white"
          />
          <kbd className="hidden rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 sm:inline-flex dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-zinc-500">
              No results found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <ul>
              {filtered.map((item, i) => (
                <li key={item.href}>
                  <button
                    type="button"
                    onClick={() => navigate(item.href)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                      i === selectedIndex
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400'
                        : 'text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800',
                    )}
                  >
                    <FileText className="h-4 w-4 shrink-0 opacity-50" />
                    <div className="flex-1 truncate">
                      <span className="font-medium">{item.title}</span>
                      {item.section && (
                        <span className="ml-2 text-xs text-zinc-400">{item.section}</span>
                      )}
                    </div>
                    {i === selectedIndex && <ArrowRight className="h-3 w-3 shrink-0 opacity-50" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-2 text-[11px] text-zinc-400 dark:border-zinc-700">
          <span>
            Navigate with <kbd className="font-mono">↑↓</kbd> keys
          </span>
          <span>
            Open with <kbd className="font-mono">⏎</kbd>
          </span>
        </div>
      </div>
    </div>
  );
}

export function SearchTrigger() {
  return (
    <button
      type="button"
      onClick={() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
      }}
      className="hidden items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 md:inline-flex dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
    >
      <Search className="h-3.5 w-3.5" />
      <span>Search</span>
      <kbd className="ml-2 rounded border border-zinc-300 bg-white px-1 py-0.5 text-[10px] font-medium dark:border-zinc-600 dark:bg-zinc-900">
        ⌘K
      </kbd>
    </button>
  );
}
