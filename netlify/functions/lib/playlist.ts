import { extractPerformanceDateFromTitle } from './derived';

export interface ParsedPlaylistTitle {
  canonicalTitle: string;
  canonicalKey: string;
  performanceDate: string | null;
  services: string[];
}

const DATE_PATTERNS = [
  /\b20\d{2}[.\-/]\s*\d{1,2}[.\-/]\s*\d{1,2}\b/g,
  /\b20\d{2}\s+\d{1,2}\s+\d{1,2}\b/g,
  /\b20\d{2}\s*년\s*\d{1,2}\s*월\s*\d{1,2}\s*일?\b/g,
];

const EVENT_WORDS = [
  '송구영신예배',
  '추수감사',
  '맥추감사',
  '부활주일',
  '부활절',
  '성탄절',
  '성탄',
];

const EVENT_PATTERN = EVENT_WORDS.join('|');

export function parsePlaylistTitle(rawTitle: string): ParsedPlaylistTitle {
  const title = rawTitle.normalize('NFC');
  const performanceDate = extractPerformanceDateFromTitle(title);
  const services = extractServices(title);
  const canonicalTitle = cleanCanonicalTitle(title);

  return {
    canonicalTitle,
    canonicalKey: titleKey(canonicalTitle),
    performanceDate,
    services,
  };
}

function extractServices(title: string): string[] {
  const services: string[] = [];
  if (/1\s*부/.test(title)) services.push('1부');
  if (/2\s*부/.test(title)) services.push('2부');
  return services.length > 0 ? services : ['1부'];
}

function cleanCanonicalTitle(rawTitle: string): string {
  const original = rawTitle.normalize('NFC');
  const quoted = original.match(/["“”']([^"“”']{2,})["“”']/);
  let title = quoted ? quoted[1] : original;

  for (const pattern of DATE_PATTERNS) {
    title = title.replace(pattern, ' ');
  }

  title = title
    .replace(/\[[^\]]*특송[^\]]*\]\s*/g, ' ')
    .replace(/\(\s*[12]\s*부\s*\)/g, ' ')
    .replace(/\+?\s*Audio\b/gi, ' ')
    .replace(/[12]\s*부\s*성가대/g, ' ')
    .replace(/[12]\s*부/g, ' ')
    .replace(/산위의마을교회/g, ' ')
    .replace(/성가대\s*찬양/g, ' ')
    .replace(/콰이어/g, ' ')
    .replace(new RegExp(`[-–—]\\s*(${EVENT_PATTERN}).*$`, 'g'), ' ')
    .replace(new RegExp(`\\(\\s*(${EVENT_PATTERN})[^)]*\\)`, 'g'), ' ')
    .replace(new RegExp(`\\s+(${EVENT_PATTERN}).*$`, 'g'), ' ')
    .replace(/\s*-\s*주일\s*대예배.*$/g, ' ')
    .replace(/^[\s\-–—:]+|[\s\-–—:]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return title || original.trim();
}

function titleKey(title: string): string {
  return title
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s"'“”‘’.,!?()[\]{}\-–—_+/:|]/g, '');
}
