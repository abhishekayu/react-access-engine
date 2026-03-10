import type { MDXComponents } from 'mdx/types';
import { CodeBlock } from '@/components/code-block';
import { Callout } from '@/components/callout';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    pre: ({ children, ...props }: React.ComponentProps<'pre'>) => {
      const codeElement = children as React.ReactElement<{ children: string; className?: string }>;
      if (codeElement?.props?.children) {
        const lang = codeElement.props.className?.replace('language-', '') ?? 'text';
        return <CodeBlock code={codeElement.props.children.trim()} language={lang} />;
      }
      return <pre {...props}>{children}</pre>;
    },
    code: ({ children, ...props }: React.ComponentProps<'code'>) => (
      <code
        className="rounded bg-zinc-100 px-1.5 py-0.5 text-sm font-mono text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
        {...props}
      >
        {children}
      </code>
    ),
    h1: ({ children, ...props }: React.ComponentProps<'h1'>) => (
      <h1
        className="mt-8 mb-4 text-4xl font-bold tracking-tight text-zinc-900 dark:text-white"
        {...props}
      >
        {children}
      </h1>
    ),
    h2: ({ children, ...props }: React.ComponentProps<'h2'>) => (
      <h2
        className="mt-10 mb-4 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-700 pb-2"
        {...props}
      >
        {children}
      </h2>
    ),
    h3: ({ children, ...props }: React.ComponentProps<'h3'>) => (
      <h3 className="mt-8 mb-3 text-xl font-semibold text-zinc-900 dark:text-white" {...props}>
        {children}
      </h3>
    ),
    p: ({ children, ...props }: React.ComponentProps<'p'>) => (
      <p className="mb-4 leading-7 text-zinc-600 dark:text-zinc-400" {...props}>
        {children}
      </p>
    ),
    ul: ({ children, ...props }: React.ComponentProps<'ul'>) => (
      <ul className="mb-4 ml-6 list-disc space-y-2 text-zinc-600 dark:text-zinc-400" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }: React.ComponentProps<'ol'>) => (
      <ol className="mb-4 ml-6 list-decimal space-y-2 text-zinc-600 dark:text-zinc-400" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }: React.ComponentProps<'li'>) => (
      <li className="leading-7" {...props}>
        {children}
      </li>
    ),
    a: ({ children, ...props }: React.ComponentProps<'a'>) => (
      <a
        className="font-medium text-blue-600 underline underline-offset-4 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
        {...props}
      >
        {children}
      </a>
    ),
    table: ({ children, ...props }: React.ComponentProps<'table'>) => (
      <div className="mb-4 overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse" {...props}>
          {children}
        </table>
      </div>
    ),
    th: ({ children, ...props }: React.ComponentProps<'th'>) => (
      <th
        className="border-b border-zinc-300 dark:border-zinc-600 px-4 py-2 font-semibold text-zinc-900 dark:text-white"
        {...props}
      >
        {children}
      </th>
    ),
    td: ({ children, ...props }: React.ComponentProps<'td'>) => (
      <td
        className="border-b border-zinc-200 dark:border-zinc-700 px-4 py-2 text-zinc-600 dark:text-zinc-400"
        {...props}
      >
        {children}
      </td>
    ),
    blockquote: ({ children, ...props }: React.ComponentProps<'blockquote'>) => (
      <blockquote
        className="mb-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/30 px-4 py-3 text-zinc-700 dark:text-zinc-300 [&>p]:mb-0"
        {...props}
      >
        {children}
      </blockquote>
    ),
    Callout,
  };
}
