import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchSettings, saveSettings, resetDemoData } from '../lib/api';
import type { AppSettings } from '../types';
import { DEFAULT_SETTINGS } from '../types';

export function Settings() {
  const qc = useQueryClient();

  const { data: settings = DEFAULT_SETTINGS } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  });

  const [draft, setDraft] = useState<AppSettings | null>(null);
  const current = draft ?? settings;

  const saveMut = useMutation({
    mutationFn: (s: AppSettings) => saveSettings(s),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      setDraft(null);
    },
  });

  const isDemo = import.meta.env.VITE_DEMO_MODE === 'true';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">설정</h1>

      {/* Recommendation settings */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-4">
        <h2 className="font-semibold text-gray-900">추천 설정</h2>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            쿨다운 기본값: {current.cooldownWeeks}주
          </label>
          <input
            type="range"
            min={4}
            max={26}
            value={current.cooldownWeeks}
            onChange={e =>
              setDraft({ ...current, cooldownWeeks: Number(e.target.value) })
            }
            className="w-full accent-indigo-600"
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">추천 가중치</p>
          {(
            [
              ['rest', '휴지 (오래될수록 ↑)'],
              ['theme', '주제 적합도'],
              ['encore', '앵콜 빈도 페널티'],
              ['readiness', '준비 용이성 (난이도 낮을수록 ↑)'],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="flex items-center gap-3">
              <span className="w-40 text-xs text-gray-500">{label}</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={current.weights[key]}
                onChange={e =>
                  setDraft({
                    ...current,
                    weights: { ...current.weights, [key]: Number(e.target.value) },
                  })
                }
                className="flex-1 accent-indigo-600"
              />
              <span className="w-10 text-right text-xs text-gray-600">
                {current.weights[key].toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={() => saveMut.mutate(current)}
          disabled={saveMut.isPending}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {saveMut.isPending ? '저장 중…' : '저장'}
        </button>
      </div>

      {/* Demo reset */}
      {isDemo && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
          <h2 className="font-semibold text-amber-900">데모 데이터 초기화</h2>
          <p className="text-xs text-amber-700">데모 데이터를 원래 상태로 되돌립니다.</p>
          <button
            onClick={() => {
              resetDemoData();
              qc.invalidateQueries();
            }}
            className="rounded-xl border border-amber-400 px-5 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100"
          >
            초기화
          </button>
        </div>
      )}
    </div>
  );
}
