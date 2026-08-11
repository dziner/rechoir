import { Link } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import type { SongWithDerived } from '../types';
import { TagBadge } from './TagBadge';
import { EncoreStatusBadge } from './EncoreStatusBadge';
import { TEMPO_KO, DIFFICULTY_KO } from '../types';
import { fmtLastPerformed } from '../lib/utils';

interface SongCardProps {
  song: SongWithDerived;
}

export function SongCard({ song }: SongCardProps) {
  const { derived, tags } = song;

  return (
    // The card body uses a stretched overlay link so the edit shortcut can sit
    // alongside it without nesting interactive elements inside an anchor.
    <div className="group relative flex gap-3 rounded-xl border border-gray-200 bg-white p-3 transition-all hover:border-indigo-200 hover:shadow-sm">
      <Link
        to={`/song/${song.id}`}
        aria-label={`${song.title} 상세 보기`}
        className="absolute inset-0 z-0 rounded-xl"
      />

      <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100">
        <img
          src={song.thumbnail}
          alt=""
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
          onError={e => {
            (e.target as HTMLImageElement).src =
              `https://img.youtube.com/vi/${song.id}/mqdefault.jpg`;
          }}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-1 text-sm font-semibold text-gray-900 group-hover:text-indigo-700">
            {song.title}
          </p>
          <Link
            to={`/song/${song.id}?edit=1`}
            aria-label={`${song.title} 정보 편집`}
            title="곡 정보 편집"
            className="relative z-10 -mr-1 -mt-1 shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <span>{fmtLastPerformed(derived)}</span>
          <span className="text-gray-300">·</span>
          <EncoreStatusBadge encoreCount={derived.encoreCount} />
        </div>

        <div className="mt-1.5 flex flex-wrap gap-1">
          {tags.theme.slice(0, 2).map(t => (
            <TagBadge key={t} label={t} variant="theme" />
          ))}
          <TagBadge label={TEMPO_KO[tags.tempo]} variant="tempo" />
          <TagBadge label={DIFFICULTY_KO[tags.difficulty]} variant="difficulty" />
          {tags.strings && <TagBadge label="🎻 현악기" variant="strings" />}
          {tags.auto.map(a => (
            <TagBadge key={a} label={a} variant="auto" />
          ))}
        </div>
      </div>
    </div>
  );
}
