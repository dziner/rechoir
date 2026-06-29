import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  title: string;
  description?: string;
}

export function LoadingState({ title, description }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-indigo-100 bg-white px-4 py-10 text-center shadow-sm"
    >
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
        <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
      </span>
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      {description && <p className="mt-1 text-xs text-gray-500">{description}</p>}
    </div>
  );
}
