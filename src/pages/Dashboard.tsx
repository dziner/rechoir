import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSongs, fetchSettings } from '../lib/api';
import { scoreSongs } from '../lib/scoring';
import { RecommendCard } from '../components/RecommendCard';
import { FilterPanel } from '../components/FilterPanel';
import type { RecommendFilters } from '../types';
import { DEFAULT_FILTERS, DEFAULT_SETTINGS } from '../types';

export function Dashboard() {
  const [filters, setFilters] = useState<RecommendFilters>(DEFAULT_FILTERS);

  const { data: songs = [], isLoading: songsLoading } = useQuery({
    queryKey: ['songs'],
    queryFn: fetchSongs,
  });

  const { data: settings = DEFAULT_SETTINGS } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  });

  const filtersWithCooldown = { ...filters, cooldownWeeks: filters.cooldownWeeks };

  const recommended = useMemo(
    () => scoreSongs(songs, filtersWithCooldown, settings),
    [songs, filtersWithCooldown, settings],
  );

  const eligible = recommended.filter(s => s.eligible);
  const ineligible = recommended.filter(s => !s.eligible);

  const isDemo = import.meta.env.VITE_DEMO_MODE === 'true';

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">이번 주 앵콜 추천</h1>
        <p className="text-sm text-gray-500">
          {eligible.length > 0
            ? `${eligible.length}곡이 추천 대상입니다`
            : '조건에 맞는 곡이 없습니다 — 필터를 조정해 보세요'}
        </p>
      </div>

      {isDemo && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          🎭 데모 모드로 실행 중입니다. 실제 데이터를 사용하려면 Google Sheets를 설정하세요.
        </div>
      )}

      <FilterPanel filters={filters} onChange={setFilters} />

      {songsLoading ? (
        <div className="flex justify-center py-16">
          <span className="animate-pulse text-gray-400">곡 목록 불러오는 중…</span>
        </div>
      ) : (
        <div className="space-y-3">
          {eligible.length === 0 && ineligible.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-300 py-12 text-center text-sm text-gray-400">
              아직 공연 기록이 있는 곡이 없습니다.<br />
              <span className="text-xs">라이브러리에서 곡을 추가하고 공연을 기록하세요.</span>
            </div>
          )}

          {/* Eligible recommendations */}
          {eligible.map((song, i) => (
            <RecommendCard key={song.id} song={song} rank={i + 1} />
          ))}

          {/* Ineligible (cooldown not met) */}
          {ineligible.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                쿨다운 미충족 ({filters.cooldownWeeks}주 기준)
              </p>
              <div className="space-y-2">
                {ineligible.slice(0, 5).map((song, i) => (
                  <RecommendCard key={song.id} song={song} rank={eligible.length + i + 1} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
