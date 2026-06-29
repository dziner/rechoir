import { Repeat2 } from 'lucide-react';
import clsx from 'clsx';

interface EncoreStatusBadgeProps {
  encoreCount: number;
  size?: 'sm' | 'md';
}

export function EncoreStatusBadge({ encoreCount, size = 'sm' }: EncoreStatusBadgeProps) {
  const hasEncore = encoreCount > 0;

  return (
    <span
      className={clsx(
        'inline-flex shrink-0 items-center gap-1 rounded-full border font-semibold',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        hasEncore
          ? 'border-rose-200 bg-rose-50 text-rose-700'
          : 'border-gray-200 bg-gray-50 text-gray-500',
      )}
    >
      <Repeat2 className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} aria-hidden="true" />
      {hasEncore ? `앵콜 ${encoreCount}회` : '앵콜 없음'}
    </span>
  );
}
