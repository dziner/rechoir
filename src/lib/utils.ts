import { format, differenceInWeeks, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { PerformanceLog, SongDerived } from '../types';

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

  // Group by date — same day 1부+2부 counts as 1 performance
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
  const encoreCount = encoreDates.length;

  const has2nd = songPerfs.some(p => p.services.includes('2부'));

  return { lastPerformedAt: lastDate, weeksSinceLast, performanceCount, encoreCount, has2nd };
}

export function fmtDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'yyyy년 M월 d일', { locale: ko });
  } catch {
    return dateStr;
  }
}

export function fmtWeeks(weeks: number | null): string {
  if (weeks === null) return '공연 기록 없음';
  if (weeks === 0) return '이번 주';
  return `${weeks}주 전`;
}

export function fmtLastPerformed(derived: SongDerived): string {
  if (!derived.lastPerformedAt || derived.weeksSinceLast === null) return '공연 기록 없음';
  return `${fmtWeeks(derived.weeksSinceLast)} (${formatDateDot(derived.lastPerformedAt)})`;
}

function formatDateDot(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'yyyy.MM.dd');
  } catch {
    return dateStr.replace(/-/g, '.');
  }
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function youtubeIdFromUrl(url: string): string {
  const match = url.match(/[?&]v=([^&]+)/) ?? url.match(/youtu\.be\/([^?]+)/);
  return match?.[1] ?? url;
}

export function thumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

export function embedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}
