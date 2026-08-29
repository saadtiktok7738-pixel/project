import { cn } from '@/lib/utils';

export function Spinner({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <div
      className={cn('animate-spin rounded-full border-2 border-cream-300 border-t-clay-600', className)}
      style={{ width: size, height: size }}
    />
  );
}

export function PageLoader({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <Spinner size={36} />
      {label && <p className="text-sm text-ink-500">{label}</p>}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="space-y-3">
      <div className="skeleton aspect-square rounded-xl" />
      <div className="skeleton h-4 w-3/4 rounded" />
      <div className="skeleton h-3 w-1/2 rounded" />
      <div className="skeleton h-6 w-1/3 rounded" />
    </div>
  );
}
