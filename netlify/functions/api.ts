import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions';
import { randomUUID } from 'node:crypto';
import { checkPassword, corsHeaders } from './lib/auth';
import {
  getSongs, getAllSongs, upsertSong, updateSongTags, getPerformances, appendPerformance,
  type Song, type PerformanceLog,
} from './lib/sheets';
import { calcDerived } from './lib/derived';

const DEFAULT_PLAYLIST_ID = 'PLeFx2jWRL18F8RYKiXudh4F7u-4PukfS7';

function resp(statusCode: number, body: unknown): HandlerResponse {
  return {
    statusCode,
    headers: corsHeaders(),
    body: JSON.stringify(body),
  };
}

function ok(body: unknown) { return resp(200, body); }
function err(code: number, msg: string) { return resp(code, { error: msg }); }

function parsePath(event: HandlerEvent): string[] {
  const raw = event.path.replace(/.*\/api/, '');
  return raw.split('/').filter(Boolean);
}

function parseBody(event: HandlerEvent): Record<string, unknown> | null {
  if (!event.body) return {};
  try {
    const parsed = JSON.parse(event.body) as unknown;
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parseTagPatch(value: unknown): Partial<Song['tags']> | null {
  if (!isRecord(value)) return null;

  const tags: Partial<Song['tags']> = {};
  if ('theme' in value) {
    if (!isStringArray(value.theme)) return null;
    tags.theme = value.theme;
  }
  if ('tempo' in value) {
    if (!['slow', 'mid', 'fast'].includes(String(value.tempo))) return null;
    tags.tempo = String(value.tempo);
  }
  if ('mood' in value) {
    if (!isStringArray(value.mood)) return null;
    tags.mood = value.mood;
  }
  if ('strings' in value) {
    if (typeof value.strings !== 'boolean') return null;
    tags.strings = value.strings;
  }
  if ('difficulty' in value) {
    if (!['low', 'mid', 'high'].includes(String(value.difficulty))) return null;
    tags.difficulty = String(value.difficulty);
  }
  if ('auto' in value) {
    if (!isStringArray(value.auto)) return null;
    tags.auto = value.auto;
  }

  return tags;
}

function parseSongTags(value: unknown): Song['tags'] | null {
  const patch = parseTagPatch(value);
  if (!patch || !patch.theme || !patch.tempo || !patch.mood
    || typeof patch.strings !== 'boolean' || !patch.difficulty) {
    return null;
  }

  return {
    theme: patch.theme,
    tempo: patch.tempo,
    mood: patch.mood,
    strings: patch.strings,
    difficulty: patch.difficulty,
    auto: patch.auto ?? [],
  };
}

function parseSong(value: unknown): Song | null {
  if (!isRecord(value)) return null;
  const tags = parseSongTags(value.tags);
  if (!tags) return null;
  if (!isNonEmptyString(value.id) || !isNonEmptyString(value.title)) return null;
  if (!isNonEmptyString(value.youtubeUrl) || !isNonEmptyString(value.thumbnail)) return null;
  if (!isIsoDate(value.publishedAt) || typeof value.active !== 'boolean') return null;

  return {
    id: value.id,
    title: value.title,
    youtubeUrl: value.youtubeUrl,
    thumbnail: value.thumbnail,
    publishedAt: value.publishedAt,
    active: value.active,
    tags,
  };
}

function parsePerformance(value: unknown): Omit<PerformanceLog, 'id'> | null {
  if (!isRecord(value)) return null;
  if (!isNonEmptyString(value.songId) || !isIsoDate(value.date)) return null;
  if (!isStringArray(value.services) || value.services.length === 0) return null;
  if (!value.services.every(service => ['1부', '2부'].includes(service))) return null;
  if (!['new', 'encore'].includes(String(value.type))) return null;
  if ('note' in value && typeof value.note !== 'string') return null;

  return {
    songId: value.songId,
    date: value.date,
    services: value.services,
    type: String(value.type),
    note: typeof value.note === 'string' ? value.note : '',
  };
}

function getPlaylistId(): string {
  return process.env.YOUTUBE_PLAYLIST_ID ?? DEFAULT_PLAYLIST_ID;
}

function shouldAutoSyncPlaylist(): boolean {
  return process.env.AUTO_SYNC_PLAYLIST_ON_EMPTY !== 'false';
}

type PlaylistSyncResult = {
  added: number;
  updated: number;
  scanned: number;
  playlistId: string;
};

async function syncPlaylistIntoSheets(): Promise<PlaylistSyncResult> {
  const youtubeApiKey = process.env.YOUTUBE_API_KEY;
  const playlistId = getPlaylistId();

  if (!youtubeApiKey) {
    throw new Error('플레이리스트 전체 동기화에는 YOUTUBE_API_KEY가 필요합니다.');
  }

  const existing = await getAllSongs();
  const existingById = new Map(existing.map(s => [s.id, s]));
  let added = 0;
  let updated = 0;
  let scanned = 0;
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      part: 'snippet',
      playlistId,
      maxResults: '50',
      key: youtubeApiKey,
      ...(pageToken ? { pageToken } : {}),
    });
    const ytRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?${params}`,
    );
    if (!ytRes.ok) {
      throw new Error(`YouTube API 오류 (${ytRes.status})`);
    }
    const data = await ytRes.json() as {
      nextPageToken?: string;
      items?: Array<{
        snippet: {
          resourceId?: { videoId?: string };
          title: string;
          publishedAt: string;
          thumbnails?: { maxres?: { url: string }; high?: { url: string } };
        };
      }>;
    };

    for (const item of data.items ?? []) {
      const videoId = item.snippet.resourceId?.videoId;
      if (!videoId || videoId === 'Private video') continue;
      scanned++;

      const song: Song = {
        id: videoId,
        title: item.snippet.title,
        youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnail:
          item.snippet.thumbnails?.maxres?.url ??
          item.snippet.thumbnails?.high?.url ??
          `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        publishedAt: item.snippet.publishedAt.slice(0, 10),
        active: true,
        tags: {
          theme: [], tempo: 'mid', mood: [], strings: false, difficulty: 'mid', auto: [],
        },
      };

      const existingSong = existingById.get(videoId);
      if (existingSong) {
        const refreshed = {
          ...existingSong,
          title: song.title,
          youtubeUrl: song.youtubeUrl,
          thumbnail: song.thumbnail,
          publishedAt: song.publishedAt,
        };
        const changed =
          refreshed.title !== existingSong.title ||
          refreshed.youtubeUrl !== existingSong.youtubeUrl ||
          refreshed.thumbnail !== existingSong.thumbnail ||
          refreshed.publishedAt !== existingSong.publishedAt;

        if (changed) {
          await upsertSong(refreshed);
          updated++;
        }
        continue;
      }

      await upsertSong(song);
      existingById.set(videoId, song);
      added++;
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  return { added, updated, scanned, playlistId };
}

const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return resp(204, '');

  const segments = parsePath(event);
  const [resource, id, action] = segments;
  const method = event.httpMethod;

  const body = parseBody(event);
  if (!body) return err(400, '요청 본문 JSON 형식이 올바르지 않습니다.');

  // --- /auth ---
  if (resource === 'auth' && method === 'POST') {
    const ok2 = checkPassword(String(body.password ?? ''));
    return ok2 ? ok({ ok: true }) : err(401, '비밀번호가 올바르지 않습니다.');
  }

  // --- /songs ---
  if (resource === 'songs') {
    if (method === 'GET') {
      try {
        let [songs, performances] = await Promise.all([getSongs(), getPerformances()]);
        if (!id && songs.length === 0 && shouldAutoSyncPlaylist()) {
          const allSongs = await getAllSongs();
          if (allSongs.length === 0) {
            try {
              await syncPlaylistIntoSheets();
              songs = await getSongs();
            } catch {
              // Keep read-only listing available even if playlist sync is not configured yet.
            }
          }
        }

        if (id) {
          const song = songs.find(s => s.id === id);
          if (!song) return err(404, '곡을 찾을 수 없습니다.');
          const perfs = performances.filter(p => p.songId === id);
          const derived = calcDerived(id, performances, song);
          const has2nd = perfs.some(p => p.services.includes('2부'));
          return ok({
            ...song,
            tags: {
              ...song.tags,
              auto: has2nd ? ['2부성가대'] : [],
            },
            derived,
            performances: perfs,
          });
        }

        const result = songs.map(song => {
          const perfs = performances.filter(p => p.songId === song.id);
          const derived = calcDerived(song.id, performances, song);
          const has2nd = perfs.some(p => p.services.includes('2부'));
          return {
            ...song,
            tags: { ...song.tags, auto: has2nd ? ['2부성가대'] : [] },
            derived,
            performances: perfs,
          };
        });
        return ok(result);
      } catch (e) {
        return err(500, (e as Error).message);
      }
    }

    if (method === 'POST' && !id) {
      // Add new song
      if (!checkPassword(String(body.password ?? ''))) return err(401, '권한 없음');
      const song = parseSong(body.song);
      if (!song) return err(400, '곡 데이터가 올바르지 않습니다.');
      try {
        await upsertSong(song);
        return ok({ ok: true });
      } catch (e) {
        return err(500, (e as Error).message);
      }
    }

    if (method === 'POST' && id && action === 'tags') {
      // Update tags
      if (!checkPassword(String(body.password ?? ''))) return err(401, '권한 없음');
      const tags = parseTagPatch(body.tags);
      if (!tags) return err(400, '태그 데이터가 올바르지 않습니다.');
      try {
        await updateSongTags(id, tags);
        return ok({ ok: true });
      } catch (e) {
        return err(500, (e as Error).message);
      }
    }
  }

  // --- /performances ---
  if (resource === 'performances') {
    if (method === 'GET') {
      try {
        const songId = event.queryStringParameters?.songId;
        const perfs = await getPerformances(songId);
        return ok(perfs);
      } catch (e) {
        return err(500, (e as Error).message);
      }
    }

    if (method === 'POST') {
      if (!checkPassword(String(body.password ?? ''))) return err(401, '권한 없음');
      const perf = parsePerformance(body.performance);
      if (!perf) return err(400, '공연 기록 데이터가 올바르지 않습니다.');
      try {
        const newPerf = { ...perf, id: randomUUID() };
        await appendPerformance(newPerf);

        // Auto-tag 2부성가대 if services includes 2부
        if (newPerf.services.includes('2부')) {
          try {
            const songs = await getSongs();
            const song = songs.find(s => s.id === newPerf.songId);
            if (song && !song.tags.auto?.includes('2부성가대')) {
              await updateSongTags(newPerf.songId, {
                ...song.tags,
                auto: [...(song.tags.auto ?? []), '2부성가대'],
              } as Song['tags']);
            }
          } catch {
            // Non-fatal — auto tag will be derived at read time anyway
          }
        }

        return ok({ ok: true, id: newPerf.id });
      } catch (e) {
        return err(500, (e as Error).message);
      }
    }
  }

  // --- /sync ---
  if (resource === 'sync' && method === 'POST') {
    if (!checkPassword(String(body.password ?? ''))) return err(401, '권한 없음');

    try {
      return ok(await syncPlaylistIntoSheets());
    } catch (e) {
      return err(500, (e as Error).message);
    }
  }

  return err(404, '알 수 없는 API 경로입니다.');
};

export { handler };
