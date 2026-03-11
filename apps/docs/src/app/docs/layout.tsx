import { Sidebar, MobileSidebar } from '@/components/sidebar';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex gap-8 lg:gap-12">
        <Sidebar />
        <article className="min-w-0 flex-1 py-8 lg:py-10">
          <MobileSidebar />
          <div className="max-w-3xl">{children}</div>
        </article>
      </div>
    </div>
  );
}
