import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Badge({ children, variant = 'neutral', className }: {
  children: ReactNode;
  variant?: 'neutral' | 'sale' | 'new' | 'bestseller' | 'success' | 'warning' | 'error' | 'gold';
  className?: string;
}) {
  const variants = {
    neutral: 'bg-ink-100 text-ink-700',
    sale: 'bg-clay-600 text-cream-50',
    new: 'bg-sage-600 text-cream-50',
    bestseller: 'bg-gold-500 text-ink-900',
    success: 'bg-sage-100 text-sage-700',
    warning: 'bg-warning-500/10 text-warning-600',
    error: 'bg-error-500/10 text-error-600',
    gold: 'bg-gold-100 text-gold-700',
  };
  return (
    <span className={cn('badge', variants[variant], className)}>
      {children}
    </span>
  );
}
