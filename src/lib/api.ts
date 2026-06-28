import type { Song, PerformanceLog, SongWithDerived, AppSettings } from '../types';
import { DEFAULT_SETTINGS } from '../types';
import { calcDerived } from './utils';
import { DEMO_SONGS, DEMO_PERFORMANCES } from './demo-data';

const DEMO = import.meta.env.VITE_DEMO_MODE === 'true';

function readJson<T>(key: string, fallback: T): T {
  const stored = localStorage.getItem(key);
  if (!stored) return JSON.parse(JSON.stringify(fallback)) as T;
  try {
    return JSON.parse(stored) as T;
  } catch {
    localStorage.removeItem(key);
    return JSON.parse(JSON.stringify(fallback)) as T;
  }
}

// In-memory store for demo mode
let demoSongs: Song[] = readJson('rechoir_songs', DEMO_SONGS);
let demoPerfs: PerformanceLog[] = readJson('rechoir_performances', DEMO_PERFORMANCES);

function saveDemoSongs() { localStorage.setItem('rechoir_songs', JSON.stringify(demoSongs)); }
function saveDemoPerfs() { localStorage.setItem('rechoir_performances', JSON.stringify(demoPerfs)); }

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? res.statusText);
  }
  return res.json();
}

// --- Songs ---

export async function fetchSongs(): Promise<SongWithDerived[]> {
  if (DEMO) {
    return demoSongs.filter(s => s.active).map(s => ({
      ...s,
      tags: {
        ...s.tags,
        auto: [
          ...s.tags.auto,
          ...(demoPerfs.some(p => p.songId === s.id && p.services.includes('2부')) ? ['2부성가대'] : []),
        ].filter((v, i, a) => a.indexOf(v) === i),
      },
      derived: calcDerived(s.id, demoPerfs),
      performances: demoPerfs.filter(p => p.songId === s.id),
    }));
  }
  return apiFetch<SongWithDerived[]>('/songs');
}

export async function fetchSong(id: string): Promise<SongWithDerived> {
  if (DEMO) {
    const song = demoSongs.find(s => s.id === id);
    if (!song) throw new Error('곡을 찾을 수 없습니다.');
    const perfs = demoPerfs.filter(p => p.songId === id);
    return {
      ...song,
      tags: {
        ...song.tags,
        auto: [
          ...song.tags.auto,
          ...(perfs.some(p => p.services.includes('2부')) ? ['2부성가대'] : []),
        ].filter((v, i, a) => a.indexOf(v) === i),
      },
      derived: calcDerived(id, demoPerfs),
      performances: perfs,
    };
  }
  return apiFetch<SongWithDerived>(`/songs/${encodeURIComponent(id)}`);
}

export async function updateSongTags(
  id: string,
  tags: Partial<Song['tags']>,
  password: string,
): Promise<void> {
  if (DEMO) {
    demoSongs = demoSongs.map(s =>
      s.id === id ? { ...s, tags: { ...s.tags, ...tags } } : s,
    );
    saveDemoSongs();
    return;
  }
  await apiFetch(`/songs/${id}/tags`, {
    method: 'POST',
    body: JSON.stringify({ tags, password }),
  });
}

export async function addSong(song: Song, password: string): Promise<void> {
  if (DEMO) {
    if (!demoSongs.find(s => s.id === song.id)) {
      demoSongs = [...demoSongs, song];
      saveDemoSongs();
    }
    return;
  }
  await apiFetch('/songs', { method: 'POST', body: JSON.stringify({ song, password }) });
}

// --- Performances ---

export async function fetchPerformances(songId?: string): Promise<PerformanceLog[]> {
  if (DEMO) {
    return songId ? demoPerfs.filter(p => p.songId === songId) : demoPerfs;
  }
  const qs = songId ? `?songId=${encodeURIComponent(songId)}` : '';
  return apiFetch<PerformanceLog[]>(`/performances${qs}`);
}

export async function addPerformance(
  perf: Omit<PerformanceLog, 'id'>,
  password: string,
): Promise<void> {
  if (DEMO) {
    const newPerf: PerformanceLog = { ...perf, id: crypto.randomUUID() };
    demoPerfs = [...demoPerfs, newPerf];
    // Auto-tag 2부성가대 if needed
    if (newPerf.services.includes('2부')) {
      demoSongs = demoSongs.map(s => {
        if (s.id !== newPerf.songId) return s;
        if (s.tags.auto.includes('2부성가대')) return s;
        return { ...s, tags: { ...s.tags, auto: [...s.tags.auto, '2부성가대'] } };
      });
      saveDemoSongs();
    }
    saveDemoPerfs();
    return;
  }
  await apiFetch('/performances', {
    method: 'POST',
    body: JSON.stringify({ performance: perf, password }),
  });
}

// --- Auth ---

export async function verifyPassword(password: string): Promise<boolean> {
  if (DEMO) {
    // In demo mode, any non-empty password works
    return password.length > 0;
  }
  try {
    await apiFetch('/auth', { method: 'POST', body: JSON.stringify({ password }) });
    return true;
  } catch {
    return false;
  }
}

// --- Settings ---

export async function fetchSettings(): Promise<AppSettings> {
  return readJson('rechoir_settings', DEFAULT_SETTINGS);
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  localStorage.setItem('rechoir_settings', JSON.stringify(settings));
}

// --- Sync ---

export async function syncPlaylist(password: string): Promise<{ added: number; updated: number }> {
  if (DEMO) {
    return { added: 0, updated: 0 };
  }
  return apiFetch('/sync', { method: 'POST', body: JSON.stringify({ password }) });
}

export function resetDemoData(): void {
  demoSongs = [...DEMO_SONGS];
  demoPerfs = [...DEMO_PERFORMANCES];
  saveDemoSongs();
  saveDemoPerfs();
}
