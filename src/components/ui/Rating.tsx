import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Rating({ value, count, size = 'sm', showCount = true }: {
  value: number;
  count?: number;
  size?: 'xs' | 'sm' | 'md';
  showCount?: boolean;
}) {
  const sizes = { xs: 11, sm: 13, md: 16 };
  const textSize = { xs: 'text-2xs', sm: 'text-xs', md: 'text-sm' };
  const px = sizes[size];

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(n => (
          <Star
            key={n}
            size={px}
            className={cn(
              n <= Math.round(value) ? 'fill-gold-400 text-gold-400' : 'fill-cream-300 text-cream-300'
            )}
          />
        ))}
      </div>
      <span className={cn('font-medium text-ink-500', textSize[size])}>
        {value.toFixed(1)}{showCount && count !== undefined ? ` (${count})` : ''}
      </span>
    </div>
  );
}
