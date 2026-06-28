import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchSongs, addPerformance } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { PasswordGate } from '../components/PasswordGate';
import type { PerformanceType, ServiceType } from '../types';

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

export function RecordPerformance() {
  return (
    <PasswordGate>
      <RecordForm />
    </PasswordGate>
  );
}
