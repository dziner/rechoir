import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchSongs, addPerformance, syncPlaylist, addSong } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { PasswordGate } from '../components/PasswordGate';
import type { PerformanceType, ServiceType, Song } from '../types';
import { youtubeIdFromUrl, thumbnailUrl } from '../lib/utils';

const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/;

function RecordForm() {
  const { getPassword } = useAuth();
  const qc = useQueryClient();

  const { data: songs = [] } = useQuery({ queryKey: ['songs'], queryFn: fetchSongs });

  const [songQuery, setSongQuery] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [services, setServices] = useState<ServiceType[]>(['1부']);
  const [type, setType] = useState<PerformanceType>('encore');
  const [note, setNote] = useState('');
  const [success, setSuccess] = useState(false);

  const filtered = useMemo(() => {
    if (!songQuery) return songs.slice(0, 10);
    const q = songQuery.toLowerCase();
    return songs.filter(s => s.title.toLowerCase().includes(q)).slice(0, 10);
  }, [songs, songQuery]);

  const selectedSong = songs.find(s => s.id === selectedId);

  const mutation = useMutation({
    mutationFn: () =>
      addPerformance({ songId: selectedId, date, services, type, note }, getPassword()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['songs'] });
      qc.invalidateQueries({ queryKey: ['song', selectedId] });
      setSuccess(true);
      setSongQuery('');
      setSelectedId('');
      setNote('');
      setTimeout(() => setSuccess(false), 3000);
    },
  });

  const toggleService = (s: ServiceType) => {
    setServices(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s],
    );
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">공연 기록</h1>

      {success && (
        <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          ✅ 공연 기록이 저장되었습니다.
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-4">
        {/* Song search */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">곡 선택</label>
          <input
            type="search"
            value={selectedSong ? selectedSong.title : songQuery}
            onChange={e => {
              setSongQuery(e.target.value);
              setSelectedId('');
            }}
            placeholder="곡 제목 검색…"
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {!selectedId && filtered.length > 0 && songQuery && (
            <ul className="mt-1 rounded-xl border border-gray-200 bg-white shadow-md overflow-hidden">
              {filtered.map(s => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(s.id);
                      setSongQuery('');
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-indigo-50 text-gray-800"
                  >
                    {s.title}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Date */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">날짜</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Services */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">예배</label>
          <div className="flex gap-2">
            {(['1부', '2부'] as ServiceType[]).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => toggleService(s)}
                className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-colors ${
                  services.includes(s)
                    ? 'border-indigo-500 bg-indigo-600 text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Type */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">구분</label>
          <div className="flex gap-2">
            {(['new', 'encore'] as PerformanceType[]).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-colors ${
                  type === t
                    ? 'border-indigo-500 bg-indigo-600 text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t === 'new' ? '신곡' : '앵콜'}
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">메모 (선택)</label>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="짧은 메모…"
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {mutation.error && (
          <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>
        )}

        <button
          type="button"
          disabled={!selectedId || !date || services.length === 0 || mutation.isPending}
          onClick={() => mutation.mutate()}
          className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {mutation.isPending ? '저장 중…' : '저장'}
        </button>
      </div>
    </div>
  );
}

function SongSyncPanel() {
  const { getPassword } = useAuth();
  const qc = useQueryClient();

  const [syncStatus, setSyncStatus] = useState('');
  const syncMut = useMutation({
    mutationFn: () => syncPlaylist(getPassword()),
    onSuccess: result => {
      qc.invalidateQueries({ queryKey: ['songs'] });
      setSyncStatus(
        `동기화 완료: ${result.scanned ?? result.added + result.updated}개 영상 확인, `
        + `${result.added}곡 추가, ${result.updated}곡 업데이트`,
      );
    },
    onError: (e: Error) => setSyncStatus(`오류: ${e.message}`),
  });

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
    const id = youtubeIdFromUrl(importUrl.trim());
    if (!YOUTUBE_ID_RE.test(id)) {
      setImportStatus('오류: 올바른 YouTube URL 또는 영상 ID를 입력해 주세요.');
      return;
    }
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
    <div className="space-y-5">
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
        <h2 className="font-semibold text-gray-900">곡정보 동기화</h2>
        <p className="text-xs text-gray-500">
          {isDemo
            ? '데모 모드에서는 실제 동기화가 비활성화됩니다.'
            : '지정된 YouTube 플레이리스트의 전체 영상 목록을 Google Sheets로 가져옵니다.'}
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
    </div>
  );
}

export function RecordPerformance() {
  return (
    <PasswordGate>
      <div className="space-y-8">
        <RecordForm />
        <SongSyncPanel />
      </div>
    </PasswordGate>
  );
}
