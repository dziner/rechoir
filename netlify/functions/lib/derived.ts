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

export function calcDerived(songId: string, performances: PerformanceLog[]): SongDerived {
  const songPerfs = performances.filter(p => p.songId === songId);

  const byDate = new Map<string, PerformanceLog[]>();
  for (const p of songPerfs) {
    const list = byDate.get(p.date) ?? [];
    list.push(p);
    byDate.set(p.date, list);
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
