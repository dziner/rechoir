import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions';
import { checkPassword, corsHeaders } from './lib/auth';
import {
  getSongs, upsertSong, updateSongTags, getPerformances, appendPerformance,
  type Song, type PerformanceLog,
} from './lib/sheets';
import { calcDerived } from './lib/derived';

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

const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return resp(204, '');

  const segments = parsePath(event);
  const [resource, id, action] = segments;
  const method = event.httpMethod;

  let body: Record<string, unknown> = {};
  if (event.body) {
    try { body = JSON.parse(event.body); } catch { /* ignore */ }
  }

  // --- /auth ---
  if (resource === 'auth' && method === 'POST') {
    const ok2 = checkPassword(String(body.password ?? ''));
    return ok2 ? ok({ ok: true }) : err(401, '비밀번호가 올바르지 않습니다.');
  }

  // --- /songs ---
  if (resource === 'songs') {
    if (method === 'GET') {
      try {
        const [songs, performances] = await Promise.all([getSongs(), getPerformances()]);
        if (id) {
          const song = songs.find(s => s.id === id);
          if (!song) return err(404, '곡을 찾을 수 없습니다.');
          const perfs = performances.filter(p => p.songId === id);
          const derived = calcDerived(id, performances);
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
          const derived = calcDerived(song.id, performances);
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
      try {
        await upsertSong(body.song as Song);
        return ok({ ok: true });
      } catch (e) {
        return err(500, (e as Error).message);
      }
    }

    if (method === 'POST' && id && action === 'tags') {
      // Update tags
      if (!checkPassword(String(body.password ?? ''))) return err(401, '권한 없음');
      try {
        await updateSongTags(id, body.tags as Partial<Song['tags']>);
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
      try {
        const perf = body.performance as Omit<PerformanceLog, 'id'>;
        const newPerf = { ...perf, id: crypto.randomUUID() };
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

    const youtubeApiKey = process.env.YOUTUBE_API_KEY;
    const playlistId = process.env.YOUTUBE_PLAYLIST_ID ?? 'PLeFx2jWRL18F8RYKiXudh4F7u-4PukfS7';

    if (!youtubeApiKey) {
      return err(400, 'YOUTUBE_API_KEY가 설정되지 않았습니다. 수동으로 곡을 추가해 주세요.');
    }

    try {
      const existing = await getSongs();
      const existingIds = new Set(existing.map(s => s.id));
      let added = 0;
      let updated = 0;
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
        const data = await ytRes.json() as {
          nextPageToken?: string;
          items?: Array<{
            snippet: {
              resourceId: { videoId: string };
              title: string;
              publishedAt: string;
              thumbnails?: { maxres?: { url: string }; high?: { url: string } };
            };
          }>;
        };

        for (const item of data.items ?? []) {
          const videoId = item.snippet.resourceId.videoId;
          if (!videoId || videoId === 'Private video') continue;
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
          if (existingIds.has(videoId)) {
            updated++;
          } else {
            await upsertSong(song);
            added++;
          }
        }

        pageToken = data.nextPageToken;
      } while (pageToken);

      return ok({ added, updated });
    } catch (e) {
      return err(500, (e as Error).message);
    }
  }

  return err(404, '알 수 없는 API 경로입니다.');
};

export { handler };
