export type Tempo = 'slow' | 'mid' | 'fast';
export type Difficulty = 'low' | 'mid' | 'high';
export type ServiceType = '1부' | '2부';
export type PerformanceType = 'new' | 'encore';

/**
 * Tempo/difficulty use '' and strings uses null to mean "nobody has set this".
 * Previously an untouched song read back as 보통/중/없음, so guesses were shown
 * next to real data and there was no way to tell them apart.
 */
export interface SongTags {
  theme: string[];
  tempo: Tempo | '';
  mood: string[];
  strings: boolean | null;
  difficulty: Difficulty | '';
  auto: string[];
}

export const UNSET_TAGS: SongTags = {
  theme: [],
  tempo: '',
  mood: [],
  strings: null,
  difficulty: '',
  auto: [],
};

export interface Song {
  id: string;
  title: string;
  youtubeUrl: string;
  thumbnail: string;
  publishedAt: string;
  active: boolean;
  tags: SongTags;
}

export interface PerformanceLog {
  id: string;
  songId: string;
  date: string;
  services: ServiceType[];
  type: PerformanceType;
  note: string;
}

export interface SongDerived {
  lastPerformedAt: string | null;
  weeksSinceLast: number | null;
  performanceCount: number;
  encoreCount: number;
  has2nd: boolean;
}

export interface SongWithDerived extends Song {
  derived: SongDerived;
  performances: PerformanceLog[];
}

export interface RecommendedSong extends SongWithDerived {
  score: number;
  reasons: string[];
  eligible: boolean;
  weeksRemaining: number | null;
}

export interface RecommendFilters {
  theme: string[];
  mood: string[];
  tempo: Tempo | '';
  difficulty: Difficulty | '';
  strings: boolean | null;
  has2nd: boolean | null;
  cooldownWeeks: number;
}

export interface AppSettings {
  cooldownWeeks: number;
  weights: {
    rest: number;
    theme: number;
    encore: number;
    readiness: number;
  };
}

export const DEFAULT_SETTINGS: AppSettings = {
  cooldownWeeks: 12,
  weights: { rest: 0.35, theme: 0.40, encore: 0.15, readiness: 0.10 },
};

export const DEFAULT_FILTERS: RecommendFilters = {
  theme: [],
  mood: [],
  tempo: '',
  difficulty: '',
  strings: null,
  has2nd: null,
  cooldownWeeks: 12,
};

export const TEMPO_KO: Record<Tempo, string> = {
  slow: '느림',
  mid: '보통',
  fast: '빠름',
};

export const DIFFICULTY_KO: Record<Difficulty, string> = {
  low: '하',
  mid: '중',
  high: '상',
};

export const COMMON_THEMES = [
  '찬양', '경배', '감사', '고백', '헌신', '위로',
  '성탄', '부활', '대림', '사순', '맥추', '추수감사',
];

export const COMMON_MOODS = ['장엄', '경건', '서정', '밝음', '역동'];
