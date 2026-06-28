import { differenceInWeeks, parseISO } from 'date-fns';

export interface PerformanceLog {
  id: string;
  songId: string;
  date: string;
  services: string[];
  type: string;
  note: string;
}

export interface SongDerived {
  lastPerformedAt: string | null;
  weeksSinceLast: number | null;
  performanceCount: number;
  encoreCount: number;
  has2nd: boolean;
}

interface DerivedSource {
  title?: string;
}

export function extractPerformanceDateFromTitle(title: string): string | null {
  const patterns = [
    /\b(20\d{2})[.\-\/]\s*(\d{1,2})[.\-\/]\s*(\d{1,2})\b/,
    /\b(20\d{2})\s+(\d{1,2})\s+(\d{1,2})\b/,
    /\b(20\d{2})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일?\b/,
  ];

  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (!match) continue;
    const [, year, month, day] = match;
    const date = normalizeDate(year, month, day);
    if (date) return date;
  }

  return null;
}

function normalizeDate(year: string, month: string, day: string): string | null {
  const yyyy = Number(year);
  const mm = Number(month);
  const dd = Number(day);
  const date = new Date(Date.UTC(yyyy, mm - 1, dd));
  if (
    date.getUTCFullYear() !== yyyy ||
    date.getUTCMonth() !== mm - 1 ||
    date.getUTCDate() !== dd
  ) {
    return null;
  }

  return `${year}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
}

export function calcDerived(
  songId: string,
  performances: PerformanceLog[],
  source?: DerivedSource,
): SongDerived {
  const songPerfs = performances.filter(p => p.songId === songId);

  const byDate = new Map<string, PerformanceLog[]>();
  for (const p of songPerfs) {
    const list = byDate.get(p.date) ?? [];
    list.push(p);
    byDate.set(p.date, list);
  }
  const titleDate = source?.title ? extractPerformanceDateFromTitle(source.title) : null;
  if (titleDate && !byDate.has(titleDate)) {
    byDate.set(titleDate, []);
  }

  const uniqueDates = [...byDate.keys()].sort();
  const lastDate = uniqueDates[uniqueDates.length - 1] ?? null;

  const weeksSinceLast = lastDate
    ? differenceInWeeks(new Date(), parseISO(lastDate))
    : null;

  const performanceCount = uniqueDates.length;

  const encoreDates = uniqueDates.filter(d =>
    byDate.get(d)!.some(p => p.type === 'encore'),
  );

  const has2nd = songPerfs.some(p => p.services.includes('2부'));

  return {
    lastPerformedAt: lastDate,
    weeksSinceLast,
    performanceCount,
    encoreCount: encoreDates.length,
    has2nd,
  };
}
