import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchSong, updateSongTags } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { TagBadge } from '../components/TagBadge';
import { YouTubeEmbed } from '../components/YouTubeEmbed';
import { PerformanceTimeline } from '../components/PerformanceTimeline';
import { TEMPO_KO, DIFFICULTY_KO, COMMON_THEMES, COMMON_MOODS } from '../types';
import type { SongTags, Tempo, Difficulty } from '../types';
import { fmtWeeks } from '../lib/utils';

export function SongDetail() {
  const { id } = useParams<{ id: string }>();
  const { authed, getPassword } = useAuth();
  const qc = useQueryClient();
  const [editingTags, setEditingTags] = useState(false);
  const [draftTags, setDraftTags] = useState<SongTags | null>(null);
  const [saveError, setSaveError] = useState('');

  const { data: song, isLoading } = useQuery({
    queryKey: ['song', id],
    queryFn: () => fetchSong(id!),
    enabled: !!id,
  });

  const saveMutation = useMutation({
    mutationFn: ({ tags }: { tags: SongTags }) =>
      updateSongTags(id!, tags, getPassword()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['song', id] });
      qc.invalidateQueries({ queryKey: ['songs'] });
      setEditingTags(false);
      setDraftTags(null);
      setSaveError('');
    },
    onError: (e: Error) => setSaveError(e.message),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-24 text-gray-400 animate-pulse">불러오는 중…</div>
    );
  }

  if (!song) {
    return (
      <div className="py-12 text-center text-gray-500">
        곡을 찾을 수 없습니다.{' '}
        <Link to="/library" className="text-indigo-600 underline">
          라이브러리로 돌아가기
        </Link>
      </div>
    );
  }

  const tags = draftTags ?? song.tags;
  const { derived } = song;

  const toggleTag = (field: 'theme' | 'mood', value: string) => {
    if (!draftTags) return;
    const arr = draftTags[field];
    setDraftTags({
      ...draftTags,
      [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value],
    });
  };

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link to="/library" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        ← 라이브러리
      </Link>

      {/* YouTube embed */}
      <YouTubeEmbed videoId={song.id} title={song.title} />

      {/* Title + stats */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">{song.title}</h1>
        <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-600">
          <span>마지막 공연: <strong>{fmtWeeks(derived.weeksSinceLast)}</strong></span>
          <span>총 공연: <strong>{derived.performanceCount}회</strong></span>
          <span>앵콜: <strong>{derived.encoreCount}회</strong></span>
        </div>
      </div>

      {/* Tags */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">태그</h2>
          {authed && !editingTags && (
            <button
              onClick={() => {
                setDraftTags(JSON.parse(JSON.stringify(song.tags)));
                setEditingTags(true);
              }}
              className="text-xs text-indigo-600 hover:underline"
            >
              편집
            </button>
          )}
          {authed && editingTags && (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingTags(false);
                  setDraftTags(null);
                  setSaveError('');
                }}
                className="text-xs text-gray-500 hover:underline"
              >
                취소
              </button>
              <button
                onClick={() => saveMutation.mutate({ tags: draftTags! })}
                disabled={saveMutation.isPending}
                className="text-xs font-semibold text-indigo-600 hover:underline disabled:opacity-50"
              >
                {saveMutation.isPending ? '저장 중…' : '저장'}
              </button>
            </div>
          )}
        </div>

        {saveError && <p className="mb-2 text-xs text-red-600">{saveError}</p>}

        {editingTags && draftTags ? (
          <div className="space-y-4">
            {/* Theme */}
            <div>
              <p className="mb-1.5 text-xs font-semibold text-gray-500">주제</p>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_THEMES.map(t => (
                  <TagBadge
                    key={t}
                    label={t}
                    variant="theme"
                    size="md"
                    active={draftTags.theme.includes(t)}
                    onClick={() => toggleTag('theme', t)}
                  />
                ))}
              </div>
            </div>
            {/* Mood */}
            <div>
              <p className="mb-1.5 text-xs font-semibold text-gray-500">분위기</p>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_MOODS.map(m => (
                  <TagBadge
                    key={m}
                    label={m}
                    variant="mood"
                    size="md"
                    active={draftTags.mood.includes(m)}
                    onClick={() => toggleTag('mood', m)}
                  />
                ))}
              </div>
            </div>
            {/* Tempo */}
            <div className="flex flex-wrap gap-4">
              <div>
                <p className="mb-1 text-xs font-semibold text-gray-500">템포</p>
                <div className="flex gap-1">
                  {(['slow', 'mid', 'fast'] as Tempo[]).map(t => (
                    <TagBadge
                      key={t}
                      label={TEMPO_KO[t]}
                      variant="tempo"
                      size="md"
                      active={draftTags.tempo === t}
                      onClick={() => setDraftTags({ ...draftTags, tempo: t })}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold text-gray-500">난이도</p>
                <div className="flex gap-1">
                  {(['low', 'mid', 'high'] as Difficulty[]).map(d => (
                    <TagBadge
                      key={d}
                      label={DIFFICULTY_KO[d]}
                      variant="difficulty"
                      size="md"
                      active={draftTags.difficulty === d}
                      onClick={() => setDraftTags({ ...draftTags, difficulty: d })}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold text-gray-500">현악기 합주</p>
                <div className="flex gap-1">
                  {[true, false].map(v => (
                    <TagBadge
                      key={String(v)}
                      label={v ? '있음' : '없음'}
                      variant="strings"
                      size="md"
                      active={draftTags.strings === v}
                      onClick={() => setDraftTags({ ...draftTags, strings: v })}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {tags.theme.map(t => <TagBadge key={t} label={t} variant="theme" size="md" />)}
            {tags.mood.map(m => <TagBadge key={m} label={m} variant="mood" size="md" />)}
            <TagBadge label={TEMPO_KO[tags.tempo]} variant="tempo" size="md" />
            <TagBadge label={DIFFICULTY_KO[tags.difficulty]} variant="difficulty" size="md" />
            <TagBadge label={tags.strings ? '현악기 있음' : '현악기 없음'} variant="strings" size="md" />
            {tags.auto.map(a => <TagBadge key={a} label={a} variant="auto" size="md" />)}
          </div>
        )}
      </div>

      {/* Performance timeline */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-4 font-semibold text-gray-900">공연 이력</h2>
        <PerformanceTimeline performances={song.performances} />
      </div>
    </div>
  );
}
