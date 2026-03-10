import { cn } from '@/lib/utils';
import { AlertCircle, Info, Lightbulb, AlertTriangle } from 'lucide-react';

const variants = {
  info: {
    icon: Info,
    container: 'border-blue-500/30 bg-blue-50 dark:bg-blue-950/20',
    title: 'text-blue-800 dark:text-blue-300',
    text: 'text-blue-700 dark:text-blue-400',
  },
  warning: {
    icon: AlertTriangle,
    container: 'border-amber-500/30 bg-amber-50 dark:bg-amber-950/20',
    title: 'text-amber-800 dark:text-amber-300',
    text: 'text-amber-700 dark:text-amber-400',
  },
  danger: {
    icon: AlertCircle,
    container: 'border-red-500/30 bg-red-50 dark:bg-red-950/20',
    title: 'text-red-800 dark:text-red-300',
    text: 'text-red-700 dark:text-red-400',
  },
  tip: {
    icon: Lightbulb,
    container: 'border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20',
    title: 'text-emerald-800 dark:text-emerald-300',
    text: 'text-emerald-700 dark:text-emerald-400',
  },
} as const;

interface CalloutProps {
  type?: keyof typeof variants;
  title?: string;
  children: React.ReactNode;
}

export function Callout({ type = 'info', title, children }: CalloutProps) {
  const variant = variants[type];
  const Icon = variant.icon;

  return (
    <div className={cn('my-4 rounded-lg border-l-4 px-4 py-3', variant.container)}>
      <div className="flex items-start gap-3">
        <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', variant.title)} />
        <div className="min-w-0">
          {title && <p className={cn('mb-1 font-semibold', variant.title)}>{title}</p>}
          <div className={cn('text-sm leading-relaxed [&>p]:mb-0', variant.text)}>{children}</div>
        </div>
      </div>
    </div>
  );
}
