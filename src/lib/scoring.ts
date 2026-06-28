import type {
  SongWithDerived, RecommendFilters, AppSettings, RecommendedSong, Difficulty,
} from '../types';
import { DIFFICULTY_KO } from '../types';
import { fmtLastPerformed } from './utils';

function tagOverlap(a: string[], b: string[]): number {
  if (b.length === 0) return 0;
  const matches = b.filter(bv => a.some(av => av.includes(bv) || bv.includes(av))).length;
  return matches / b.length;
}

function calcThemeFit(
  songTheme: string[], songMood: string[],
  filterTheme: string[], filterMood: string[],
): number {
  if (filterTheme.length === 0 && filterMood.length === 0) return 0.5;
  const themeScore = filterTheme.length > 0 ? tagOverlap(songTheme, filterTheme) : 0.5;
  const moodScore = filterMood.length > 0 ? tagOverlap(songMood, filterMood) : 0.5;
  const hasTheme = filterTheme.length > 0;
  const hasMood = filterMood.length > 0;
  if (hasTheme && hasMood) return (themeScore + moodScore) / 2;
  return hasTheme ? themeScore : moodScore;
}

function readinessScore(difficulty: Difficulty): number {
  const map: Record<Difficulty, number> = { low: 1, mid: 0.5, high: 0 };
  return map[difficulty];
}

function difficultyRank(difficulty: Difficulty): number {
  const map: Record<Difficulty, number> = { low: 0, mid: 1, high: 2 };
  return map[difficulty];
}

function compareRecommendedSongs(a: RecommendedSong, b: RecommendedSong): number {
  if (a.eligible && !b.eligible) return -1;
  if (!a.eligible && b.eligible) return 1;

  const aWeeks = a.derived.weeksSinceLast ?? -1;
  const bWeeks = b.derived.weeksSinceLast ?? -1;
  if (aWeeks !== bWeeks) return bWeeks - aWeeks;

  if (a.derived.encoreCount !== b.derived.encoreCount) {
    return a.derived.encoreCount - b.derived.encoreCount;
  }

  const difficultyDiff = difficultyRank(a.tags.difficulty) - difficultyRank(b.tags.difficulty);
  if (difficultyDiff !== 0) return difficultyDiff;

  if (a.score !== b.score) return b.score - a.score;
  return a.title.localeCompare(b.title, 'ko');
}

function reasonText(
  song: SongWithDerived,
  filterTheme: string[],
  filterMood: string[],
): string[] {
  const { derived, tags } = song;
  const reasons: string[] = [];

  if (derived.weeksSinceLast !== null) {
    reasons.push(`마지막 **${fmtLastPerformed(derived)}**`);
  } else {
    reasons.push('공연 이력 없음 (신곡 후보)');
  }

  reasons.push(`앵콜 **${derived.encoreCount}회**`);

  const hasFilter = filterTheme.length > 0 || filterMood.length > 0;
  if (hasFilter) {
    const matchedTheme = filterTheme.filter(f =>
      tags.theme.some(t => t.includes(f) || f.includes(t)),
    );
    const matchedMood = filterMood.filter(f =>
      tags.mood.some(t => t.includes(f) || f.includes(t)),
    );
    const matched = [...matchedTheme, ...matchedMood];
    if (matched.length > 0) {
      reasons.push(`주제 *${matched.join('·')}* 일치`);
    }
  } else if (tags.theme.length > 0) {
    reasons.push(`주제 ${tags.theme.slice(0, 3).join('·')}`);
  }

  reasons.push(`난이도 *${DIFFICULTY_KO[tags.difficulty]}*`);
  if (tags.strings) reasons.push('현악기 합주');
  if (tags.auto.includes('2부성가대')) reasons.push('`2부성가대`');

  return reasons;
}

export function scoreSongs(
  songs: SongWithDerived[],
  filters: RecommendFilters,
  settings: AppSettings,
): RecommendedSong[] {
  const hasThemeFilter = filters.theme.length > 0 || filters.mood.length > 0;

  const weights = hasThemeFilter
    ? { rest: 0.25, theme: 0.55, encore: 0.12, readiness: 0.08 }
    : settings.weights;

  const cooldown = filters.cooldownWeeks;

  const candidates = songs.filter(s => s.derived.performanceCount > 0 || s.active);

  return candidates
    .map(song => {
      const { derived, tags } = song;

      const eligible =
        derived.weeksSinceLast === null
          ? false // never performed → not encore candidate
          : derived.weeksSinceLast >= cooldown;

      const weeksRemaining =
        derived.weeksSinceLast !== null && !eligible
          ? cooldown - derived.weeksSinceLast
          : null;

      const restScore =
        derived.weeksSinceLast === null
          ? 0
          : Math.min(derived.weeksSinceLast / 52, 1);

      const themeFit = calcThemeFit(tags.theme, tags.mood, filters.theme, filters.mood);
      const encorePenalty = Math.min(derived.encoreCount / 10, 1);
      const readiness = readinessScore(tags.difficulty);

      // Apply hard tag filters
      if (filters.tempo && tags.tempo !== filters.tempo) {
        return null;
      }
      if (filters.difficulty && tags.difficulty !== filters.difficulty) {
        return null;
      }
      if (filters.strings !== null && tags.strings !== filters.strings) {
        return null;
      }

      const rawScore = eligible
        ? weights.rest * restScore
          + weights.theme * themeFit
          - weights.encore * encorePenalty
          + weights.readiness * readiness
        : 0;

      return {
        ...song,
        score: Math.max(0, rawScore),
        reasons: reasonText(song, filters.theme, filters.mood),
        eligible,
        weeksRemaining,
      } as RecommendedSong;
    })
    .filter((s): s is RecommendedSong => s !== null)
    .sort(compareRecommendedSongs);
}
