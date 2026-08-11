import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil } from 'lucide-react';
import { fetchSong, updateSong, type SongPatch } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { TagBadge } from '../components/TagBadge';
import { EncoreStatusBadge } from '../components/EncoreStatusBadge';
import { LoadingState } from '../components/LoadingState';
import { YouTubeEmbed } from '../components/YouTubeEmbed';
import { PerformanceTimeline } from '../components/PerformanceTimeline';
import { InlineUnlock } from '../components/InlineUnlock';
import { TEMPO_KO, DIFFICULTY_KO, COMMON_THEMES, COMMON_MOODS } from '../types';
import type { SongTags, Tempo, Difficulty } from '../types';
import { fmtLastPerformed, isValidYoutubeId } from '../lib/utils';

interface Draft {
  title: string;
  publishedAt: string;
  tags: SongTags;
}

export function SongDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { authed, getPassword } = useAuth();
  const qc = useQueryClient();

  const [draft, setDraft] = useState<Draft | null>(null);
  const [askUnlock, setAskUnlock] = useState(false);
  const [saveError, setSaveError] = useState('');

  const { data: song, isLoading } = useQuery({
    queryKey: ['song', id],
    queryFn: () => fetchSong(id!),
    enabled: !!id,
  });

  // Library links here with ?edit=1 to jump straight into editing.
  const wantsEdit = searchParams.get('edit') === '1';

  const startEditing = () => {
    if (!song) return;
    setDraft({
      title: song.title,
      publishedAt: song.publishedAt,
      tags: JSON.parse(JSON.stringify(song.tags)) as SongTags,
    });
    setSaveError('');
  };

  const stopEditing = () => {
    setDraft(null);
    setAskUnlock(false);
    setSaveError('');
    if (wantsEdit) {
      searchParams.delete('edit');
      setSearchParams(searchParams, { replace: true });
    }
  };

  useEffect(() => {
    if (!song || !wantsEdit || draft) return;
    if (authed) startEditing();
    else setAskUnlock(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song, wantsEdit, authed]);

  const saveMutation = useMutation({
    mutationFn: (patch: SongPatch) => updateSong(id!, patch, getPassword()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['song', id] });
      qc.invalidateQueries({ queryKey: ['songs'] });
      stopEditing();
    },
    onError: (e: Error) => setSaveError(e.message),
  });

  if (isLoading) {
    return (
      <LoadingState
        title="곡 정보 불러오는 중"
        description="영상, 태그, 공연 이력을 확인하고 있습니다."
      />
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

  const editing = draft !== null;
  const view = draft ?? { title: song.title, publishedAt: song.publishedAt, tags: song.tags };
  const { derived } = song;
  const hasVideo = isValidYoutubeId(song.id);

  const toggleTag = (field: 'theme' | 'mood', value: string) => {
    if (!draft) return;
    const arr = draft.tags[field];
    setDraft({
      ...draft,
      tags: {
        ...draft.tags,
        [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value],
      },
    });
  };

  const handleSave = () => {
    if (!draft) return;
    const title = draft.title.trim();
    if (!title) {
      setSaveError('곡 제목을 입력해 주세요.');
      return;
    }
    saveMutation.mutate({
      title,
      publishedAt: draft.publishedAt,
      tags: {
        theme: draft.tags.theme,
        tempo: draft.tags.tempo,
        mood: draft.tags.mood,
        strings: draft.tags.strings,
        difficulty: draft.tags.difficulty,
      },
    });
  };

  return (
    <div className="space-y-5 pb-4">
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/library"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
        >
          ← 라이브러리
        </Link>

        {!editing && (
          <button
            type="button"
            onClick={() => (authed ? startEditing() : setAskUnlock(true))}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 px-3 py-1.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            곡 정보 편집
          </button>
        )}
      </div>

      {askUnlock && !authed && (
        <InlineUnlock
          onUnlocked={startEditing}
          onCancel={() => {
            setAskUnlock(false);
            if (wantsEdit) {
              searchParams.delete('edit');
              setSearchParams(searchParams, { replace: true });
            }
          }}
        />
      )}

      {/* Sticky save bar keeps the actions reachable while editing long forms */}
      {editing && (
        <div className="sticky top-14 z-20 -mx-4 flex items-center justify-between gap-3 border-b border-indigo-100 bg-indigo-50/95 px-4 py-3 backdrop-blur-sm">
          <span className="text-sm font-semibold text-indigo-900">곡 정보 편집 중</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={stopEditing}
              disabled={saveMutation.isPending}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saveMutation.isPending ? '저장 중…' : '저장'}
            </button>
          </div>
        </div>
      )}

      {saveError && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {saveError}
        </p>
      )}

      {/* Video */}
      {hasVideo ? (
        <YouTubeEmbed videoId={song.id} title={song.title} />
      ) : (
        <div className="flex aspect-video w-full flex-col items-center justify-center gap-1 rounded-xl bg-purple-50 text-purple-700">
          <span className="text-2xl">🎤</span>
          <p className="text-sm font-semibold">유튜브 영상 없음</p>
          <p className="text-xs text-purple-500">방송 문제 등으로 영상이 업로드되지 않은 곡입니다.</p>
        </div>
      )}

      {/* Title + date */}
      {editing && draft ? (
        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">곡 제목</label>
            <input
              type="text"
              value={draft.title}
              onChange={e => setDraft({ ...draft, title: e.target.value })}
              placeholder="곡 제목"
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-base font-semibold focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              {hasVideo ? '영상 공개일' : '등록일'}
            </label>
            <input
              type="date"
              value={draft.publishedAt}
              onChange={e => setDraft({ ...draft, publishedAt: e.target.value })}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <p className="mt-1 text-xs text-gray-400">
              공연 이력과는 별개인 곡 자체의 날짜입니다. 공연 날짜는 아래 공연 이력에서 관리됩니다.
            </p>
          </div>
        </div>
      ) : (
        <div>
          <h1 className="text-xl font-bold text-gray-900">{view.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
            <span>마지막 공연: <strong>{fmtLastPerformed(derived)}</strong></span>
            <span>총 공연: <strong>{derived.performanceCount}회</strong></span>
            <EncoreStatusBadge encoreCount={derived.encoreCount} size="md" />
          </div>
        </div>
      )}

      {/* Tags */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-3 font-semibold text-gray-900">태그</h2>

        {editing && draft ? (
          <div className="space-y-4">
            <div>
              <p className="mb-1.5 text-xs font-semibold text-gray-500">주제</p>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_THEMES.map(t => (
                  <TagBadge
                    key={t}
                    label={t}
                    variant="theme"
                    size="md"
                    active={draft.tags.theme.includes(t)}
                    onClick={() => toggleTag('theme', t)}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-semibold text-gray-500">분위기</p>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_MOODS.map(m => (
                  <TagBadge
                    key={m}
                    label={m}
                    variant="mood"
                    size="md"
                    active={draft.tags.mood.includes(m)}
                    onClick={() => toggleTag('mood', m)}
                  />
                ))}
              </div>
            </div>
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
                      active={draft.tags.tempo === t}
                      onClick={() => setDraft({ ...draft, tags: { ...draft.tags, tempo: t } })}
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
                      active={draft.tags.difficulty === d}
                      onClick={() => setDraft({ ...draft, tags: { ...draft.tags, difficulty: d } })}
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
                      active={draft.tags.strings === v}
                      onClick={() => setDraft({ ...draft, tags: { ...draft.tags, strings: v } })}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {view.tags.theme.map(t => <TagBadge key={t} label={t} variant="theme" size="md" />)}
            {view.tags.mood.map(m => <TagBadge key={m} label={m} variant="mood" size="md" />)}
            <TagBadge label={TEMPO_KO[view.tags.tempo]} variant="tempo" size="md" />
            <TagBadge label={DIFFICULTY_KO[view.tags.difficulty]} variant="difficulty" size="md" />
            {view.tags.strings && <TagBadge label="🎻 현악기" variant="strings" size="md" />}
            {view.tags.auto.map(a => <TagBadge key={a} label={a} variant="auto" size="md" />)}
          </div>
        )}
      </div>

      {/* Performance timeline */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-semibold text-gray-900">공연 이력</h2>
          <Link to="/record" className="text-xs font-semibold text-indigo-600 hover:underline">
            기록 추가
          </Link>
        </div>
        <PerformanceTimeline performances={song.performances} />
      </div>
    </div>
  );
}
