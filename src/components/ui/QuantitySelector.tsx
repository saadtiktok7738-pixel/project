import { Minus, Plus } from 'lucide-react';

export function QuantitySelector({ value, onChange, max = 99, size = 'md' }: {
  value: number;
  onChange: (v: number) => void;
  max?: number;
  size?: 'sm' | 'md';
}) {
  const dims = size === 'sm' ? { btn: 'h-8 w-8', icon: 14, text: 'text-xs' } : { btn: 'h-10 w-10', icon: 16, text: 'text-sm' };
  return (
    <div className="inline-flex items-center rounded-lg border border-cream-400 bg-cream-50">
      <button
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        className={`${dims.btn} flex items-center justify-center text-ink-600 hover:text-ink-900 hover:bg-ink-100 transition-colors rounded-l-lg disabled:opacity-30 disabled:cursor-not-allowed`}
        aria-label="Decrease quantity"
      >
        <Minus size={dims.icon} />
      </button>
      <span className={`w-10 text-center font-medium text-ink-800 ${dims.text}`}>{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className={`${dims.btn} flex items-center justify-center text-ink-600 hover:text-ink-900 hover:bg-ink-100 transition-colors rounded-r-lg disabled:opacity-30 disabled:cursor-not-allowed`}
        aria-label="Increase quantity"
      >
        <Plus size={dims.icon} />
      </button>
    </div>
  );
}
