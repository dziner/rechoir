import type { Song } from './sheets';

type RuleTags = Song['tags'];

interface AutoTagInput {
  canonicalTitle: string;
  rawTitles: string[];
  descriptions: string[];
}

type Pattern = string | RegExp;

const DEFAULT_TAGS: RuleTags = {
  theme: [],
  tempo: 'mid',
  mood: [],
  strings: false,
  difficulty: 'mid',
  auto: [],
};

const THEME_RULES: Array<{ tag: string; patterns: Pattern[] }> = [
  { tag: '성탄', patterns: ['성탄', '크리스마스', 'christmas', '캐롤', '구유', '아기 예수'] },
  { tag: '부활', patterns: ['부활', 'resurrection', 'easter', /\bi\s*am\b/i] },
  { tag: '대림', patterns: ['대림', 'advent', '기다리', '오소서'] },
  { tag: '사순', patterns: ['사순', '십자가', '보혈', '고난', '갈보리', '겟세마네'] },
  { tag: '맥추', patterns: ['맥추'] },
  { tag: '추수감사', patterns: ['추수', '감사절', 'thanksgiving'] },
  { tag: '감사', patterns: ['감사', '은혜', 'grace', '맥추', '추수감사'] },
  { tag: '경배', patterns: ['경배', '예배', '왕께', '보좌', '거룩', '영광'] },
  { tag: '찬양', patterns: ['찬양', '찬송', '송축', '할렐루야', '기뻐', '영광', '주님을 찬양'] },
  { tag: '고백', patterns: ['고백', '믿음', '기도', '원합니다', '소원', '나의 마음', '주님을', '십자가'] },
  { tag: '헌신', patterns: ['헌신', '드리', '보내소서', '사명', '순종', '주의 길', '나를 사용'] },
  { tag: '위로', patterns: ['위로', '평안', '피난처', '쉴 곳', '그늘', '품', '사랑', '선하심'] },
];

const MOOD_RULES: Array<{ tag: string; patterns: Pattern[] }> = [
  { tag: '장엄', patterns: ['장엄', '위대', '영광', '왕', '보좌', '온 땅', '만왕'] },
  { tag: '경건', patterns: ['경건', '거룩', '십자가', '보혈', '기도', '말씀', '예배'] },
  { tag: '서정', patterns: ['서정', '은혜', '품', '사랑', '위로', '쉴', '평안', '그늘', '선하심'] },
  { tag: '밝음', patterns: ['밝음', '기쁨', '기뻐', '감사', '부활', '성탄', '찬송 메들리'] },
  { tag: '역동', patterns: ['역동', '송축', '할렐루야', '전심', '기뻐하며', '멈출 수 없네', '다 함께 찬양'] },
];

const TEMPO_RULES: Array<{ value: string; patterns: Pattern[] }> = [
  {
    value: 'slow',
    patterns: ['십자가', '보혈', '은혜', '품', '위로', '기도', '말씀 앞', '소원', '평안', '그늘', '쉴'],
  },
  {
    value: 'fast',
    patterns: ['송축', '할렐루야', '기뻐', '전심', '멈출 수 없네', '다 함께', '왕께', '찬양하세'],
  },
];

const DIFFICULTY_RULES: Array<{ value: string; patterns: Pattern[] }> = [
  {
    value: 'high',
    patterns: ['메들리', 'medley', '+', 'audio', 'orchestra', '오케스트라', 'cantata', '칸타타', '찬송 메들리'],
  },
  {
    value: 'low',
    patterns: ['찬송가', '예수를 나의 구주 삼고', '내 영혼에 햇빛 비치니', '주의 친절한 팔에 안기세', '슬픈 마음 있는 사람', '빈 들에 마른 풀 같이'],
  },
];

const STRINGS_PATTERNS: Pattern[] = [
  '현악',
  '스트링',
  'strings',
  'orchestra',
  '오케스트라',
  '바이올린',
  'violin',
  '첼로',
  'cello',
];

export function inferTagsFromMetadata(input: AutoTagInput): RuleTags {
  const haystack = normalizeText([
    input.canonicalTitle,
    ...input.rawTitles,
    ...input.descriptions,
  ].join(' '));

  return {
    theme: pickRuleTags(THEME_RULES, haystack),
    tempo: pickRuleValue(TEMPO_RULES, haystack) ?? DEFAULT_TAGS.tempo,
    mood: pickRuleTags(MOOD_RULES, haystack),
    strings: matchesAny(haystack, STRINGS_PATTERNS),
    difficulty: pickRuleValue(DIFFICULTY_RULES, haystack) ?? DEFAULT_TAGS.difficulty,
    auto: [],
  };
}

export function mergeInferredTags(existing: RuleTags | undefined, inferred: RuleTags): RuleTags {
  const current = existing ?? DEFAULT_TAGS;

  return {
    theme: current.theme.length > 0 ? current.theme : inferred.theme,
    tempo: current.tempo && current.tempo !== 'mid' ? current.tempo : inferred.tempo,
    mood: current.mood.length > 0 ? current.mood : inferred.mood,
    strings: current.strings || inferred.strings,
    difficulty: current.difficulty && current.difficulty !== 'mid'
      ? current.difficulty
      : inferred.difficulty,
    auto: current.auto ?? [],
  };
}

export function tagsEqual(left: RuleTags, right: RuleTags): boolean {
  return arraysEqual(left.theme, right.theme) &&
    left.tempo === right.tempo &&
    arraysEqual(left.mood, right.mood) &&
    left.strings === right.strings &&
    left.difficulty === right.difficulty &&
    arraysEqual(left.auto ?? [], right.auto ?? []);
}

function pickRuleTags(rules: Array<{ tag: string; patterns: Pattern[] }>, haystack: string): string[] {
  return rules
    .filter(rule => matchesAny(haystack, rule.patterns))
    .map(rule => rule.tag);
}

function pickRuleValue(
  rules: Array<{ value: string; patterns: Pattern[] }>,
  haystack: string,
): string | null {
  return rules.find(rule => matchesAny(haystack, rule.patterns))?.value ?? null;
}

function matchesAny(haystack: string, patterns: Pattern[]): boolean {
  const compactHaystack = compactText(haystack);
  return patterns.some(pattern => {
    if (pattern instanceof RegExp) return pattern.test(haystack);

    const normalizedPattern = normalizeText(pattern);
    const compactPattern = compactText(normalizedPattern);
    return haystack.includes(normalizedPattern) ||
      (compactPattern.length > 0 && compactHaystack.includes(compactPattern));
  });
}

function normalizeText(value: string): string {
  return value.normalize('NFKC').toLowerCase();
}

function compactText(value: string): string {
  return normalizeText(value).replace(/[\s"'“”‘’.,!?()[\]{}\-–—_+/:|]/g, '');
}

function arraysEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  return left.every((item, index) => item === right[index]);
}
