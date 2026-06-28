import clsx from 'clsx';

interface TagBadgeProps {
  label: string;
  variant?: 'theme' | 'mood' | 'auto' | 'tempo' | 'difficulty' | 'strings' | 'default';
  size?: 'sm' | 'md';
  onClick?: () => void;
  active?: boolean;
}

const variantClasses: Record<string, string> = {
  theme: 'bg-indigo-100 text-indigo-800',
  mood: 'bg-purple-100 text-purple-800',
  auto: 'bg-amber-100 text-amber-800 font-semibold',
  tempo: 'bg-teal-100 text-teal-800',
  difficulty: 'bg-rose-100 text-rose-800',
  strings: 'bg-green-100 text-green-800',
  default: 'bg-gray-100 text-gray-700',
};

export function TagBadge({ label, variant = 'default', size = 'sm', onClick, active }: TagBadgeProps) {
  const base = clsx(
    'inline-flex items-center rounded-full font-medium transition-colors',
    size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
    active ? 'ring-2 ring-offset-1 ring-indigo-500' : '',
    onClick ? 'cursor-pointer hover:opacity-80' : '',
    variantClasses[variant] ?? variantClasses.default,
  );

  if (onClick) {
    return (
      <button className={base} onClick={onClick} type="button">
        {label}
      </button>
    );
  }
  return <span className={base}>{label}</span>;
}
