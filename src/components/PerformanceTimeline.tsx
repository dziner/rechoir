import type { PerformanceLog } from '../types';
import { fmtDate } from '../lib/utils';

interface PerformanceTimelineProps {
  performances: PerformanceLog[];
}

export function PerformanceTimeline({ performances }: PerformanceTimelineProps) {
  if (performances.length === 0) {
    return <p className="text-sm text-gray-500">아직 공연 기록이 없습니다.</p>;
  }

  // Deduplicate by date (same-day 1부+2부 = one entry)
  const byDate = new Map<string, PerformanceLog[]>();
  for (const p of performances) {
    const list = byDate.get(p.date) ?? [];
    list.push(p);
    byDate.set(p.date, list);
  }

  const entries = [...byDate.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, perfs]) => ({
      date,
      type: perfs.some(p => p.type === 'encore') ? 'encore' : 'new',
      services: [...new Set(perfs.flatMap(p => p.services))],
      note: perfs.find(p => p.note)?.note ?? '',
    }));

  return (
    <ol className="relative border-l-2 border-gray-200 pl-5 space-y-4">
      {entries.map(e => (
        <li key={e.date} className="relative">
          <span
            className={`absolute -left-[1.35rem] flex h-4 w-4 items-center justify-center rounded-full border-2 border-white ${
              e.type === 'new' ? 'bg-indigo-500' : 'bg-amber-400'
            }`}
          />
          <div className="flex items-start gap-2 flex-wrap">
            <time className="text-xs font-medium text-gray-500 whitespace-nowrap">
              {fmtDate(e.date)}
            </time>
            <span
              className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                e.type === 'new'
                  ? 'bg-indigo-100 text-indigo-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {e.type === 'new' ? '신곡' : '앵콜'}
            </span>
            {e.services.map(s => (
              <span key={s} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                {s}
              </span>
            ))}
          </div>
          {e.note && <p className="mt-1 text-xs text-gray-500">{e.note}</p>}
        </li>
      ))}
    </ol>
  );
}
