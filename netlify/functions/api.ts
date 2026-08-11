import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions';
import { randomUUID } from 'node:crypto';
import { checkPassword, corsHeaders } from './lib/auth';
import {
  getSongs, getAllSongs, upsertSong, updateSongTags, updateSongFields, getPerformances,
  appendPerformance, upsertPerformancesBySongDate, PLAYLIST_SYNC_NOTE,
  type Song, type PerformanceLog, type SongFieldPatch,
} from './lib/sheets';
import { calcDerived } from './lib/derived';
import { parsePlaylistTitle, type ParsedPlaylistTitle } from './lib/playlist';
import { inferTagsFromMetadata, mergeInferredTags, tagsEqual } from './lib/autoTags';

const DEFAULT_PLAYLIST_ID = 'PLeFx2jWRL18F8RYKiXudh4F7u-4PukfS7';

function resp(statusCode: number, body: unknown): HandlerResponse {
  return {
    statusCode,
    headers: {
      ...corsHeaders(),
      'Cache-Control': 'no-store',
    },
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

function parseSongPatch(value: unknown): SongFieldPatch | null {
  if (!isRecord(value)) return null;

  const patch: SongFieldPatch = {};
  if ('title' in value) {
    if (!isNonEmptyString(value.title)) return null;
    patch.title = value.title.trim();
  }
  if ('publishedAt' in value) {
    if (!isIsoDate(value.publishedAt)) return null;
    patch.publishedAt = value.publishedAt;
  }
  if ('active' in value) {
    if (typeof value.active !== 'boolean') return null;
    patch.active = value.active;
  }
  if ('tags' in value) {
    const tags = parseTagPatch(value.tags);
    if (!tags) return null;
    patch.tags = tags;
  }

  return patch;
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

function shouldSyncPlaylistOnRead(): boolean {
  const configured = process.env.SYNC_PLAYLIST_ON_READ
    ?? process.env.AUTO_SYNC_PLAYLIST_ON_EMPTY;
  return configured !== 'false';
}

type PlaylistSyncResult = {
  added: number;
  updated: number;
  scanned: number;
  playlistId: string;
  addedTitles: string[];
  updatedTitles: string[];
  removedPerformances: number;
};

interface PlaylistVideo {
  videoId: string;
  title: string;
  description: string;
  youtubeUrl: string;
  thumbnail: string;
  publishedAt: string;
  parsed: ParsedPlaylistTitle;
}

async function syncPlaylistIntoSheets(): Promise<PlaylistSyncResult> {
  const youtubeApiKey = process.env.YOUTUBE_API_KEY;
  const playlistId = getPlaylistId();

  if (!youtubeApiKey) {
    throw new Error('플레이리스트 전체 동기화에는 YOUTUBE_API_KEY가 필요합니다.');
  }

  const existing = await getAllSongs();
  const existingById = new Map(existing.map(s => [s.id, s]));
  const canonicalByKey = new Map<string, Song>();
  for (const song of existing) {
    const key = parsePlaylistTitle(song.title).canonicalKey;
    const current = canonicalByKey.get(key);
    if (!key || (current && compareSongRecency(current, song) <= 0)) continue;
    canonicalByKey.set(key, song);
  }

  const videos: PlaylistVideo[] = [];
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
          description?: string;
          publishedAt: string;
          thumbnails?: { maxres?: { url: string }; high?: { url: string } };
        };
      }>;
    };

    for (const item of data.items ?? []) {
      const videoId = item.snippet.resourceId?.videoId;
      if (!videoId || videoId === 'Private video') continue;
      scanned++;

      videos.push({
        videoId,
        title: item.snippet.title,
        description: item.snippet.description ?? '',
        youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnail:
          item.snippet.thumbnails?.maxres?.url ??
          item.snippet.thumbnails?.high?.url ??
          `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        publishedAt: item.snippet.publishedAt.slice(0, 10),
        parsed: parsePlaylistTitle(item.snippet.title),
      });
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  const videosByKey = new Map<string, PlaylistVideo[]>();
  for (const video of videos) {
    const group = videosByKey.get(video.parsed.canonicalKey) ?? [];
    group.push(video);
    videosByKey.set(video.parsed.canonicalKey, group);
  }

  const playlistPerformances: Array<Omit<PerformanceLog, 'id'> & { id: string }> = [];
  const addedTitles: string[] = [];
  const updatedTitles: string[] = [];
  const syncedSongIds = new Set<string>();

  for (const [key, group] of videosByKey) {
    const bestVideo = [...group].sort(comparePlaylistVideoRecency)[0];
    const existingCanonical = canonicalByKey.get(key);
    const baseTags = existingCanonical?.tags ?? {
      theme: [], tempo: 'mid', mood: [], strings: false, difficulty: 'mid', auto: [],
    };
    const inferredTags = inferTagsFromMetadata({
      canonicalTitle: bestVideo.parsed.canonicalTitle,
      rawTitles: group.map(video => video.title),
      descriptions: group.map(video => video.description),
    });
    const canonicalSong: Song = {
      ...(existingCanonical ?? {
        id: bestVideo.videoId,
        active: true,
        tags: baseTags,
      }),
      title: bestVideo.parsed.canonicalTitle,
      youtubeUrl: bestVideo.youtubeUrl,
      thumbnail: bestVideo.thumbnail,
      publishedAt: bestVideo.publishedAt,
      active: true,
      tags: mergeInferredTags(baseTags, inferredTags),
    };
    const existingRow = existingCanonical ?? existingById.get(bestVideo.videoId);
    const changed = !existingRow || hasSongChanged(existingRow, canonicalSong);

    if (changed) {
      await upsertSong(canonicalSong);
      if (existingRow) {
        updated++;
        updatedTitles.push(canonicalSong.title);
      } else {
        added++;
        addedTitles.push(canonicalSong.title);
      }
    }
    canonicalByKey.set(key, canonicalSong);

    for (const video of group) {
      const duplicate = existingById.get(video.videoId);
      if (duplicate && duplicate.id !== canonicalSong.id && duplicate.active) {
        await upsertSong({ ...duplicate, active: false });
        updated++;
        updatedTitles.push(duplicate.title);
      }
    }

    const performanceDates = collectPlaylistPerformances(group);
    for (const [index, performance] of performanceDates.entries()) {
      playlistPerformances.push({
        id: randomUUID(),
        songId: canonicalSong.id,
        date: performance.date,
        services: performance.services,
        type: index === 0 ? 'new' : 'encore',
        note: PLAYLIST_SYNC_NOTE,
      });
    }
    syncedSongIds.add(canonicalSong.id);
  }

  // Prune sync-created dates that the playlist no longer claims, so correcting
  // a performance date in a YouTube title actually moves the record instead of
  // leaving the old date behind.
  const { removed } = await upsertPerformancesBySongDate(playlistPerformances, {
    pruneSyncedSongIds: syncedSongIds,
  });

  return {
    added, updated, scanned, playlistId, addedTitles, updatedTitles,
    removedPerformances: removed,
  };
}

function comparePlaylistVideoRecency(a: PlaylistVideo, b: PlaylistVideo): number {
  const aDate = a.parsed.performanceDate ?? a.publishedAt;
  const bDate = b.parsed.performanceDate ?? b.publishedAt;
  const dateCompare = bDate.localeCompare(aDate);
  // Stable tiebreak so the "representative" video for a canonical song
  // never flips between runs when two videos share the same date
  // (e.g. 1부/2부 uploaded as separate videos) — otherwise the
  // youtubeUrl/thumbnail/publishedAt would oscillate and the song
  // would look "changed" on every sync forever.
  return dateCompare !== 0 ? dateCompare : a.videoId.localeCompare(b.videoId);
}

function compareSongRecency(a: Song, b: Song): number {
  const aDate = parsePlaylistTitle(a.title).performanceDate ?? a.publishedAt;
  const bDate = parsePlaylistTitle(b.title).performanceDate ?? b.publishedAt;
  const dateCompare = bDate.localeCompare(aDate);
  return dateCompare !== 0 ? dateCompare : a.id.localeCompare(b.id);
}

function hasSongChanged(left: Song, right: Song): boolean {
  return left.title !== right.title ||
    left.youtubeUrl !== right.youtubeUrl ||
    left.thumbnail !== right.thumbnail ||
    left.publishedAt !== right.publishedAt ||
    left.active !== right.active ||
    !tagsEqual(left.tags, right.tags);
}

function collectPlaylistPerformances(
  videos: PlaylistVideo[],
): Array<{ date: string; services: string[] }> {
  const byDate = new Map<string, Set<string>>();
  for (const video of videos) {
    if (!video.parsed.performanceDate) continue;
    const services = byDate.get(video.parsed.performanceDate) ?? new Set<string>();
    for (const service of video.parsed.services) services.add(service);
    byDate.set(video.parsed.performanceDate, services);
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, services]) => ({
      date,
      services: [...services].sort((a, b) => a.localeCompare(b, 'ko')),
    }));
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
        const performancesPromise = getPerformances();
        let songs: Song[] | null = null;
        if (shouldSyncPlaylistOnRead()) {
          try {
            await syncPlaylistIntoSheets();
          } catch (e) {
            const existingSongs = await getSongs();
            if (existingSongs.length === 0) throw e;
            songs = existingSongs;
          }
        }
        songs ??= await getSongs();
        const performances = await performancesPromise;

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

    if (method === 'POST' && id && !action) {
      // Update an existing song's editable fields (title / date / tags)
      if (!checkPassword(String(body.password ?? ''))) return err(401, '권한 없음');
      const patch = parseSongPatch(body.song);
      if (!patch) return err(400, '곡 데이터가 올바르지 않습니다.');
      try {
        await updateSongFields(id, patch);
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
