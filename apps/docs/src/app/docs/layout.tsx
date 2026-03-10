import { Sidebar, MobileSidebar } from '@/components/sidebar';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex gap-10">
        <Sidebar />
        <article className="min-w-0 flex-1 py-8 lg:py-12">
          <MobileSidebar />
          <div className="prose prose-zinc dark:prose-invert max-w-none">{children}</div>
        </article>
      </div>
    </div>
  );
}
