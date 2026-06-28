import type { Song, PerformanceLog } from '../types';

export const DEMO_SONGS: Song[] = [
  {
    id: 'dQw4w9WgXcQ',
    title: '주 하나님 지으신 모든 세계',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    publishedAt: '2022-01-15',
    active: true,
    tags: { theme: ['경배', '찬양'], tempo: 'slow', mood: ['장엄', '경건'], strings: true, difficulty: 'mid', auto: [] },
  },
  {
    id: 'oHg5SJYRHA0',
    title: '내 주를 가까이 하게 함은',
    youtubeUrl: 'https://www.youtube.com/watch?v=oHg5SJYRHA0',
    thumbnail: 'https://img.youtube.com/vi/oHg5SJYRHA0/maxresdefault.jpg',
    publishedAt: '2022-03-06',
    active: true,
    tags: { theme: ['헌신', '고백'], tempo: 'slow', mood: ['서정', '경건'], strings: false, difficulty: 'low', auto: [] },
  },
  {
    id: 'LsoLEjrDogU',
    title: '감사하는 마음으로',
    youtubeUrl: 'https://www.youtube.com/watch?v=LsoLEjrDogU',
    thumbnail: 'https://img.youtube.com/vi/LsoLEjrDogU/maxresdefault.jpg',
    publishedAt: '2022-06-19',
    active: true,
    tags: { theme: ['감사', '찬양'], tempo: 'mid', mood: ['밝음'], strings: false, difficulty: 'low', auto: [] },
  },
  {
    id: 'kJQP7kiw5Fk',
    title: '할렐루야 찬양하세',
    youtubeUrl: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
    thumbnail: 'https://img.youtube.com/vi/kJQP7kiw5Fk/maxresdefault.jpg',
    publishedAt: '2022-08-14',
    active: true,
    tags: { theme: ['찬양', '경배'], tempo: 'fast', mood: ['역동', '밝음'], strings: true, difficulty: 'high', auto: ['2부성가대'] },
  },
  {
    id: 'JGwWNGJdvx8',
    title: '만 입이 내게 있으면',
    youtubeUrl: 'https://www.youtube.com/watch?v=JGwWNGJdvx8',
    thumbnail: 'https://img.youtube.com/vi/JGwWNGJdvx8/maxresdefault.jpg',
    publishedAt: '2022-10-02',
    active: true,
    tags: { theme: ['찬양', '감사'], tempo: 'mid', mood: ['경건', '장엄'], strings: false, difficulty: 'mid', auto: [] },
  },
  {
    id: 'fJ9rUzIMcZQ',
    title: '부활의 주를 찬양',
    youtubeUrl: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ',
    thumbnail: 'https://img.youtube.com/vi/fJ9rUzIMcZQ/maxresdefault.jpg',
    publishedAt: '2023-04-09',
    active: true,
    tags: { theme: ['부활', '찬양'], tempo: 'fast', mood: ['역동', '밝음'], strings: true, difficulty: 'high', auto: [] },
  },
  {
    id: 'CvBfHwUxHIk',
    title: '하나님은 우리의 피난처',
    youtubeUrl: 'https://www.youtube.com/watch?v=CvBfHwUxHIk',
    thumbnail: 'https://img.youtube.com/vi/CvBfHwUxHIk/maxresdefault.jpg',
    publishedAt: '2023-06-18',
    active: true,
    tags: { theme: ['위로', '고백'], tempo: 'slow', mood: ['서정', '경건'], strings: false, difficulty: 'low', auto: ['2부성가대'] },
  },
  {
    id: 'yhWn5PqTkDs',
    title: '주님의 마음을 본받는 자',
    youtubeUrl: 'https://www.youtube.com/watch?v=yhWn5PqTkDs',
    thumbnail: 'https://img.youtube.com/vi/yhWn5PqTkDs/maxresdefault.jpg',
    publishedAt: '2023-09-10',
    active: true,
    tags: { theme: ['헌신', '고백'], tempo: 'mid', mood: ['경건', '서정'], strings: false, difficulty: 'mid', auto: [] },
  },
  {
    id: 'tVj0ZTS4WF4',
    title: '맥추절 감사 찬양',
    youtubeUrl: 'https://www.youtube.com/watch?v=tVj0ZTS4WF4',
    thumbnail: 'https://img.youtube.com/vi/tVj0ZTS4WF4/maxresdefault.jpg',
    publishedAt: '2023-07-02',
    active: true,
    tags: { theme: ['맥추', '감사'], tempo: 'mid', mood: ['밝음', '감사'], strings: false, difficulty: 'low', auto: [] },
  },
  {
    id: 'xEe8V2C5zBs',
    title: '추수 감사 찬양',
    youtubeUrl: 'https://www.youtube.com/watch?v=xEe8V2C5zBs',
    thumbnail: 'https://img.youtube.com/vi/xEe8V2C5zBs/maxresdefault.jpg',
    publishedAt: '2023-11-19',
    active: true,
    tags: { theme: ['추수감사', '감사'], tempo: 'mid', mood: ['밝음'], strings: false, difficulty: 'low', auto: [] },
  },
  {
    id: 'pRpeEdMmmQ0',
    title: '성탄의 기쁨',
    youtubeUrl: 'https://www.youtube.com/watch?v=pRpeEdMmmQ0',
    thumbnail: 'https://img.youtube.com/vi/pRpeEdMmmQ0/maxresdefault.jpg',
    publishedAt: '2023-12-24',
    active: true,
    tags: { theme: ['성탄', '기쁨'], tempo: 'fast', mood: ['밝음', '역동'], strings: true, difficulty: 'mid', auto: [] },
  },
  {
    id: 'F1B9Fz73d60',
    title: '대림절 주님 오소서',
    youtubeUrl: 'https://www.youtube.com/watch?v=F1B9Fz73d60',
    thumbnail: 'https://img.youtube.com/vi/F1B9Fz73d60/maxresdefault.jpg',
    publishedAt: '2024-12-01',
    active: true,
    tags: { theme: ['대림', '경배'], tempo: 'slow', mood: ['장엄', '경건'], strings: true, difficulty: 'high', auto: [] },
  },
  {
    id: 'Sagg08DrO5U',
    title: '사순절 주 십자가',
    youtubeUrl: 'https://www.youtube.com/watch?v=Sagg08DrO5U',
    thumbnail: 'https://img.youtube.com/vi/Sagg08DrO5U/maxresdefault.jpg',
    publishedAt: '2024-03-10',
    active: true,
    tags: { theme: ['사순', '고백'], tempo: 'slow', mood: ['경건', '서정'], strings: false, difficulty: 'mid', auto: [] },
  },
  {
    id: 'lXMskKTw3Bc',
    title: '예수 사랑하심을',
    youtubeUrl: 'https://www.youtube.com/watch?v=lXMskKTw3Bc',
    thumbnail: 'https://img.youtube.com/vi/lXMskKTw3Bc/maxresdefault.jpg',
    publishedAt: '2024-05-05',
    active: true,
    tags: { theme: ['찬양', '위로'], tempo: 'slow', mood: ['서정', '밝음'], strings: false, difficulty: 'low', auto: ['2부성가대'] },
  },
  {
    id: 'M7lc1UVf-VE',
    title: '십자가 군병들아',
    youtubeUrl: 'https://www.youtube.com/watch?v=M7lc1UVf-VE',
    thumbnail: 'https://img.youtube.com/vi/M7lc1UVf-VE/maxresdefault.jpg',
    publishedAt: '2024-08-18',
    active: true,
    tags: { theme: ['헌신', '찬양'], tempo: 'fast', mood: ['역동'], strings: false, difficulty: 'mid', auto: [] },
  },
];

// Today offset helper
function weeksAgo(weeks: number): string {
  const d = new Date();
  d.setDate(d.getDate() - weeks * 7);
  return d.toISOString().slice(0, 10);
}

export const DEMO_PERFORMANCES: PerformanceLog[] = [
  // 주 하나님 지으신 모든 세계 — 신곡 후 앵콜 2회
  { id: 'p001', songId: 'dQw4w9WgXcQ', date: weeksAgo(60), services: ['1부'], type: 'new', note: '' },
  { id: 'p002', songId: 'dQw4w9WgXcQ', date: weeksAgo(40), services: ['1부'], type: 'encore', note: '' },
  { id: 'p003', songId: 'dQw4w9WgXcQ', date: weeksAgo(14), services: ['1부', '2부'], type: 'encore', note: '' },

  // 내 주를 가까이 하게 함은 — 신곡 후 앵콜 1회
  { id: 'p004', songId: 'oHg5SJYRHA0', date: weeksAgo(80), services: ['1부'], type: 'new', note: '' },
  { id: 'p005', songId: 'oHg5SJYRHA0', date: weeksAgo(22), services: ['1부'], type: 'encore', note: '' },

  // 감사하는 마음으로 — 신곡, 앵콜 3회, 최근 6주
  { id: 'p006', songId: 'LsoLEjrDogU', date: weeksAgo(100), services: ['1부'], type: 'new', note: '' },
  { id: 'p007', songId: 'LsoLEjrDogU', date: weeksAgo(55), services: ['1부'], type: 'encore', note: '' },
  { id: 'p008', songId: 'LsoLEjrDogU', date: weeksAgo(30), services: ['1부'], type: 'encore', note: '' },
  { id: 'p009', songId: 'LsoLEjrDogU', date: weeksAgo(6), services: ['1부', '2부'], type: 'encore', note: '' },

  // 할렐루야 찬양하세 — 신곡, 앵콜 1회
  { id: 'p010', songId: 'kJQP7kiw5Fk', date: weeksAgo(70), services: ['1부'], type: 'new', note: '' },
  { id: 'p011', songId: 'kJQP7kiw5Fk', date: weeksAgo(18), services: ['1부', '2부'], type: 'encore', note: '' },

  // 만 입이 내게 있으면 — 신곡 후 앵콜 2회
  { id: 'p012', songId: 'JGwWNGJdvx8', date: weeksAgo(90), services: ['1부'], type: 'new', note: '' },
  { id: 'p013', songId: 'JGwWNGJdvx8', date: weeksAgo(45), services: ['1부'], type: 'encore', note: '' },
  { id: 'p014', songId: 'JGwWNGJdvx8', date: weeksAgo(16), services: ['1부'], type: 'encore', note: '' },

  // 부활의 주를 찬양 — 신곡만 (올해 4월)
  { id: 'p015', songId: 'fJ9rUzIMcZQ', date: weeksAgo(60), services: ['1부'], type: 'new', note: '' },
  { id: 'p016', songId: 'fJ9rUzIMcZQ', date: weeksAgo(13), services: ['1부'], type: 'encore', note: '' },

  // 하나님은 우리의 피난처 — 신곡, 앵콜 1회
  { id: 'p017', songId: 'CvBfHwUxHIk', date: weeksAgo(50), services: ['1부'], type: 'new', note: '' },
  { id: 'p018', songId: 'CvBfHwUxHIk', date: weeksAgo(20), services: ['1부', '2부'], type: 'encore', note: '' },

  // 주님의 마음을 본받는 자 — 신곡만
  { id: 'p019', songId: 'yhWn5PqTkDs', date: weeksAgo(40), services: ['1부'], type: 'new', note: '' },

  // 맥추절 감사 찬양 — 신곡 후 앵콜 1회
  { id: 'p020', songId: 'tVj0ZTS4WF4', date: weeksAgo(104), services: ['1부'], type: 'new', note: '' },
  { id: 'p021', songId: 'tVj0ZTS4WF4', date: weeksAgo(52), services: ['1부'], type: 'encore', note: '' },

  // 추수 감사 찬양 — 신곡 후 앵콜 2회
  { id: 'p022', songId: 'xEe8V2C5zBs', date: weeksAgo(130), services: ['1부'], type: 'new', note: '' },
  { id: 'p023', songId: 'xEe8V2C5zBs', date: weeksAgo(78), services: ['1부'], type: 'encore', note: '' },
  { id: 'p024', songId: 'xEe8V2C5zBs', date: weeksAgo(27), services: ['1부'], type: 'encore', note: '' },

  // 성탄의 기쁨 — 신곡 후 앵콜 1회
  { id: 'p025', songId: 'pRpeEdMmmQ0', date: weeksAgo(80), services: ['1부'], type: 'new', note: '' },
  { id: 'p026', songId: 'pRpeEdMmmQ0', date: weeksAgo(28), services: ['1부', '2부'], type: 'encore', note: '' },

  // 대림절 주님 오소서 — 최근 신곡 (5주 전)
  { id: 'p027', songId: 'F1B9Fz73d60', date: weeksAgo(5), services: ['1부'], type: 'new', note: '' },

  // 사순절 주 십자가 — 신곡, 앵콜 1회
  { id: 'p028', songId: 'Sagg08DrO5U', date: weeksAgo(65), services: ['1부'], type: 'new', note: '' },
  { id: 'p029', songId: 'Sagg08DrO5U', date: weeksAgo(15), services: ['1부'], type: 'encore', note: '' },

  // 예수 사랑하심을 — 신곡 후 앵콜 2회
  { id: 'p030', songId: 'lXMskKTw3Bc', date: weeksAgo(110), services: ['1부'], type: 'new', note: '' },
  { id: 'p031', songId: 'lXMskKTw3Bc', date: weeksAgo(60), services: ['1부', '2부'], type: 'encore', note: '' },
  { id: 'p032', songId: 'lXMskKTw3Bc', date: weeksAgo(25), services: ['1부'], type: 'encore', note: '' },

  // 십자가 군병들아 — 최근 신곡 (8주 전)
  { id: 'p033', songId: 'M7lc1UVf-VE', date: weeksAgo(8), services: ['1부'], type: 'new', note: '' },
];
