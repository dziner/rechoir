import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchSettings, saveSettings, syncPlaylist, addSong, resetDemoData } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { PasswordGate } from '../components/PasswordGate';
import type { AppSettings, Song } from '../types';
import { DEFAULT_SETTINGS } from '../types';
import { generateId, youtubeIdFromUrl, thumbnailUrl } from '../lib/utils';

function SettingsForm() {
  const { getPassword } = useAuth();
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

  const [syncStatus, setSyncStatus] = useState('');
  const syncMut = useMutation({
    mutationFn: () => syncPlaylist(getPassword()),
    onSuccess: result => {
      qc.invalidateQueries({ queryKey: ['songs'] });
      setSyncStatus(`동기화 완료: ${result.added}곡 추가, ${result.updated}곡 업데이트`);
    },
    onError: (e: Error) => setSyncStatus(`오류: ${e.message}`),
  });

  // Manual import
  const [importUrl, setImportUrl] = useState('');
  const [importTitle, setImportTitle] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const importMut = useMutation({
    mutationFn: (song: Song) => addSong(song, getPassword()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['songs'] });
      setImportUrl('');
      setImportTitle('');
      setImportStatus('곡이 추가되었습니다.');
      setTimeout(() => setImportStatus(''), 3000);
    },
    onError: (e: Error) => setImportStatus(`오류: ${e.message}`),
  });

  const handleImport = () => {
    if (!importUrl || !importTitle) return;
    const id = youtubeIdFromUrl(importUrl);
    const song: Song = {
      id,
      title: importTitle,
      youtubeUrl: `https://www.youtube.com/watch?v=${id}`,
      thumbnail: thumbnailUrl(id),
      publishedAt: new Date().toISOString().slice(0, 10),
      active: true,
      tags: {
        theme: [],
        tempo: 'mid',
        mood: [],
        strings: false,
        difficulty: 'mid',
        auto: [],
      },
    };
    importMut.mutate(song);
  };

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

      {/* Manual song import */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
        <h2 className="font-semibold text-gray-900">곡 직접 추가</h2>
        <p className="text-xs text-gray-500">YouTube URL과 곡 제목을 입력해 곡을 추가합니다.</p>
        <input
          type="url"
          value={importUrl}
          onChange={e => setImportUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
        />
        <input
          type="text"
          value={importTitle}
          onChange={e => setImportTitle(e.target.value)}
          placeholder="곡 제목"
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
        />
        {importStatus && (
          <p className={`text-sm ${importStatus.startsWith('오류') ? 'text-red-600' : 'text-green-700'}`}>
            {importStatus}
          </p>
        )}
        <button
          onClick={handleImport}
          disabled={!importUrl || !importTitle || importMut.isPending}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {importMut.isPending ? '추가 중…' : '추가'}
        </button>
      </div>

      {/* YouTube playlist sync */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
        <h2 className="font-semibold text-gray-900">플레이리스트 동기화</h2>
        <p className="text-xs text-gray-500">
          {isDemo
            ? '데모 모드에서는 실제 동기화가 비활성화됩니다.'
            : 'YOUTUBE_API_KEY 환경변수가 설정된 경우 사용할 수 있습니다.'}
        </p>
        {syncStatus && (
          <p className={`text-sm ${syncStatus.startsWith('오류') ? 'text-red-600' : 'text-green-700'}`}>
            {syncStatus}
          </p>
        )}
        <button
          onClick={() => syncMut.mutate()}
          disabled={syncMut.isPending || isDemo}
          className="rounded-xl border border-indigo-300 px-5 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-40"
        >
          {syncMut.isPending ? '동기화 중…' : '지금 동기화'}
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

export function Settings() {
  return (
    <PasswordGate>
      <SettingsForm />
    </PasswordGate>
  );
}
