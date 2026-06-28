import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSongs } from '../lib/api';
import { SongCard } from '../components/SongCard';
import type { SongWithDerived } from '../types';

type SortKey = 'lastPerformed' | 'encoreCount' | 'title';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'lastPerformed', label: '마지막 공연 순' },
  { value: 'encoreCount', label: '앵콜 많은 순' },
  { value: 'title', label: '제목 순' },
];

function sortSongs(songs: SongWithDerived[], key: SortKey): SongWithDerived[] {
  return [...songs].sort((a, b) => {
    if (key === 'title') return a.title.localeCompare(b.title, 'ko');
    if (key === 'encoreCount') return b.derived.encoreCount - a.derived.encoreCount;
    // lastPerformed: null (never) goes last
    const da = a.derived.lastPerformedAt ?? '';
    const db = b.derived.lastPerformedAt ?? '';
    return db.localeCompare(da);
  });
}

function filterSongs(songs: SongWithDerived[], query: string): SongWithDerived[] {
  if (!query.trim()) return songs;
  const q = query.toLowerCase().trim();
  return songs.filter(s => {
    if (s.title.toLowerCase().includes(q)) return true;
    const allTags = [...s.tags.theme, ...s.tags.mood, ...s.tags.auto];
    return allTags.some(t => t.toLowerCase().includes(q));
  });
}

export function Library() {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('lastPerformed');

  const { data: songs = [], isLoading } = useQuery({
    queryKey: ['songs'],
    queryFn: fetchSongs,
  });

  const displayed = useMemo(
    () => sortSongs(filterSongs(songs, query), sort),
    [songs, query, sort],
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">곡 라이브러리</h1>

      {/* Search + sort */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="제목 또는 태그 검색…"
            className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-8 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <select
          value={sort}
          onChange={e => setSort(e.target.value as SortKey)}
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <span className="animate-pulse text-gray-400">불러오는 중…</span>
        </div>
      ) : displayed.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-12 text-center text-sm text-gray-400">
          {query ? `"${query}"에 해당하는 곡이 없습니다` : '곡이 없습니다'}
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400">{displayed.length}곡</p>
          <div className="space-y-2">
            {displayed.map(song => (
              <SongCard key={song.id} song={song} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
