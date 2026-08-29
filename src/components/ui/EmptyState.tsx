import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function EmptyState({ icon, title, description, action, className }: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      {icon && <div className="mb-4 text-ink-300">{icon}</div>}
      <h3 className="text-lg font-display font-medium text-ink-800">{title}</h3>
      {description && <p className="mt-2 text-sm text-ink-500 max-w-sm">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-error-500/10 text-error-500 text-xl font-bold">!</div>
      <h3 className="text-lg font-display font-medium text-ink-800">Something went wrong</h3>
      <p className="mt-2 text-sm text-ink-500 max-w-sm">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-outline mt-6">Try Again</button>
      )}
    </div>
  );
}
