'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
}

export function CodeBlock({ code, language = 'tsx', filename, showLineNumbers }: CodeBlockProps) {
  const [html, setHtml] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    import('shiki').then(({ codeToHtml }) => {
      codeToHtml(code, {
        lang: language,
        themes: { light: 'github-light', dark: 'github-dark' },
      }).then((result) => {
        if (!cancelled) setHtml(result);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [code, language]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative mb-4 rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      {filename && (
        <div className="flex items-center border-b border-zinc-200 px-4 py-2 dark:border-zinc-700">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{filename}</span>
        </div>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            'absolute right-2 top-2 z-10 rounded-md px-2 py-1 text-xs font-medium transition-all',
            'opacity-0 group-hover:opacity-100',
            'bg-zinc-200 text-zinc-700 hover:bg-zinc-300',
            'dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600',
          )}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
        {html ? (
          <div
            className={cn(showLineNumbers && '[&_.shiki]:pl-12')}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <pre className="overflow-x-auto p-4 text-sm">
            <code className="text-zinc-800 dark:text-zinc-200">{code}</code>
          </pre>
        )}
      </div>
    </div>
  );
}
