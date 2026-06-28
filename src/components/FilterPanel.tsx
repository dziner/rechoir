import { useState } from 'react';
import type { RecommendFilters, Tempo, Difficulty } from '../types';
import { COMMON_THEMES, COMMON_MOODS, TEMPO_KO, DIFFICULTY_KO } from '../types';
import { TagBadge } from './TagBadge';

interface FilterPanelProps {
  filters: RecommendFilters;
  onChange: (f: RecommendFilters) => void;
}

export function FilterPanel({ filters, onChange }: FilterPanelProps) {
  const [open, setOpen] = useState(false);

  const toggleTheme = (t: string) => {
    const next = filters.theme.includes(t)
      ? filters.theme.filter(x => x !== t)
      : [...filters.theme, t];
    onChange({ ...filters, theme: next });
  };

  const toggleMood = (m: string) => {
    const next = filters.mood.includes(m)
      ? filters.mood.filter(x => x !== m)
      : [...filters.mood, m];
    onChange({ ...filters, mood: next });
  };

  const activeCount =
    filters.theme.length +
    filters.mood.length +
    (filters.tempo ? 1 : 0) +
    (filters.difficulty ? 1 : 0) +
    (filters.strings !== null ? 1 : 0);

  const reset = () =>
    onChange({ theme: [], mood: [], tempo: '', difficulty: '', strings: null, cooldownWeeks: filters.cooldownWeeks });

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-2 text-sm font-medium text-gray-700"
        >
          <span>필터</span>
          {activeCount > 0 && (
            <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs text-white">
              {activeCount}
            </span>
          )}
          <span className="text-gray-400">{open ? '▲' : '▼'}</span>
        </button>
        {activeCount > 0 && (
          <button onClick={reset} className="text-xs text-gray-500 underline">
            초기화
          </button>
        )}
      </div>

      {open && (
        <div className="mt-4 space-y-4">
          {/* 주제 */}
          <div>
            <p className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">주제</p>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_THEMES.map(t => (
                <TagBadge
                  key={t}
                  label={t}
                  variant="theme"
                  size="md"
                  active={filters.theme.includes(t)}
                  onClick={() => toggleTheme(t)}
                />
              ))}
            </div>
          </div>

          {/* 분위기 */}
          <div>
            <p className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">분위기</p>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_MOODS.map(m => (
                <TagBadge
                  key={m}
                  label={m}
                  variant="mood"
                  size="md"
                  active={filters.mood.includes(m)}
                  onClick={() => toggleMood(m)}
                />
              ))}
            </div>
          </div>

          {/* 템포·난이도·현악기 */}
          <div className="flex flex-wrap gap-4">
            <div>
              <p className="mb-1.5 text-xs font-semibold text-gray-500">템포</p>
              <div className="flex gap-1">
                {(['slow', 'mid', 'fast'] as Tempo[]).map(t => (
                  <TagBadge
                    key={t}
                    label={TEMPO_KO[t]}
                    variant="tempo"
                    size="md"
                    active={filters.tempo === t}
                    onClick={() => onChange({ ...filters, tempo: filters.tempo === t ? '' : t })}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-semibold text-gray-500">난이도</p>
              <div className="flex gap-1">
                {(['low', 'mid', 'high'] as Difficulty[]).map(d => (
                  <TagBadge
                    key={d}
                    label={DIFFICULTY_KO[d]}
                    variant="difficulty"
                    size="md"
                    active={filters.difficulty === d}
                    onClick={() => onChange({ ...filters, difficulty: filters.difficulty === d ? '' : d })}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-semibold text-gray-500">현악기</p>
              <div className="flex gap-1">
                {[true, false].map(v => (
                  <TagBadge
                    key={String(v)}
                    label={v ? '있음' : '없음'}
                    variant="strings"
                    size="md"
                    active={filters.strings === v}
                    onClick={() => onChange({ ...filters, strings: filters.strings === v ? null : v })}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 쿨다운 */}
          <div>
            <p className="mb-1.5 text-xs font-semibold text-gray-500">
              쿨다운: {filters.cooldownWeeks}주 이내 제외
            </p>
            <input
              type="range"
              min={4}
              max={26}
              step={1}
              value={filters.cooldownWeeks}
              onChange={e => onChange({ ...filters, cooldownWeeks: Number(e.target.value) })}
              className="w-full accent-indigo-600"
            />
          </div>
        </div>
      )}

      {/* Active filter chips when collapsed */}
      {!open && activeCount > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {filters.theme.map(t => (
            <TagBadge key={t} label={t} variant="theme" onClick={() => toggleTheme(t)} />
          ))}
          {filters.mood.map(m => (
            <TagBadge key={m} label={m} variant="mood" onClick={() => toggleMood(m)} />
          ))}
          {filters.tempo && (
            <TagBadge
              label={TEMPO_KO[filters.tempo]}
              variant="tempo"
              onClick={() => onChange({ ...filters, tempo: '' })}
            />
          )}
          {filters.difficulty && (
            <TagBadge
              label={DIFFICULTY_KO[filters.difficulty]}
              variant="difficulty"
              onClick={() => onChange({ ...filters, difficulty: '' })}
            />
          )}
          {filters.strings !== null && (
            <TagBadge
              label={filters.strings ? '현악기 있음' : '현악기 없음'}
              variant="strings"
              onClick={() => onChange({ ...filters, strings: null })}
            />
          )}
        </div>
      )}
    </div>
  );
}
