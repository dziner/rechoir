import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ListMusic, Repeat2, Search } from 'lucide-react';
import clsx from 'clsx';
import { fetchSongs } from '../lib/api';
import { SongCard } from '../components/SongCard';
import { LoadingState } from '../components/LoadingState';
import type { SongWithDerived } from '../types';

type SortKey = 'lastPerformed' | 'encoreCount' | 'title';
type ViewMode = 'all' | 'encore';

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
  const [view, setView] = useState<ViewMode>('all');

  const { data: songs = [], isLoading } = useQuery({
    queryKey: ['songs'],
    queryFn: fetchSongs,
  });

  const counts = useMemo(() => ({
    all: songs.length,
    encore: songs.filter(song => song.derived.encoreCount > 0).length,
  }), [songs]);

  const displayed = useMemo(() => {
    const scoped = view === 'encore'
      ? songs.filter(song => song.derived.encoreCount > 0)
      : songs;
    return sortSongs(filterSongs(scoped, query), sort);
  }, [songs, query, sort, view]);

  const viewOptions: Array<{
    value: ViewMode;
    label: string;
    count: number;
    icon: typeof ListMusic;
  }> = [
    { value: 'all', label: '전체', count: counts.all, icon: ListMusic },
    { value: 'encore', label: '앵콜곡', count: counts.encore, icon: Repeat2 },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">곡 라이브러리</h1>

      <div className="grid grid-cols-2 gap-2">
        {viewOptions.map(option => {
          const Icon = option.icon;
          const active = view === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => setView(option.value)}
              className={clsx(
                'flex min-h-14 items-center justify-between rounded-xl border px-3 text-left transition-colors',
                active
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-800 shadow-sm'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50',
              )}
            >
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span className="text-sm font-semibold">{option.label}</span>
              </span>
              <span
                className={clsx(
                  'rounded-full px-2 py-0.5 text-xs font-bold',
                  active ? 'bg-white text-indigo-700' : 'bg-gray-100 text-gray-500',
                )}
              >
                {option.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search + sort */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="제목 또는 태그 검색…"
            className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
        <LoadingState
          title="곡 목록 불러오는 중"
          description="Google Sheets와 플레이리스트 데이터를 확인하고 있습니다."
        />
      ) : displayed.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-12 text-center text-sm text-gray-400">
          {query
            ? `"${query}"에 해당하는 곡이 없습니다`
            : view === 'encore'
            ? '앵콜 기록이 있는 곡이 없습니다'
            : '곡이 없습니다'}
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
