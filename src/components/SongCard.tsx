import { Link } from 'react-router-dom';
import type { SongWithDerived } from '../types';
import { TagBadge } from './TagBadge';
import { TEMPO_KO, DIFFICULTY_KO } from '../types';
import { fmtLastPerformed } from '../lib/utils';

interface SongCardProps {
  song: SongWithDerived;
}

export function SongCard({ song }: SongCardProps) {
  const { derived, tags } = song;

  return (
    <Link
      to={`/song/${song.id}`}
      className="group flex gap-3 rounded-xl border border-gray-200 bg-white p-3 transition-all hover:border-indigo-200 hover:shadow-sm"
    >
      <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100">
        <img
          src={song.thumbnail}
          alt={song.title}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
          onError={e => {
            (e.target as HTMLImageElement).src =
              `https://img.youtube.com/vi/${song.id}/mqdefault.jpg`;
          }}
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-sm font-semibold text-gray-900 group-hover:text-indigo-700">
          {song.title}
        </p>

        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
          <span>{fmtLastPerformed(derived)}</span>
          {derived.encoreCount > 0 && (
            <>
              <span className="text-gray-300">·</span>
              <span>앵콜 {derived.encoreCount}회</span>
            </>
          )}
        </div>

        <div className="mt-1.5 flex flex-wrap gap-1">
          {tags.theme.slice(0, 2).map(t => (
            <TagBadge key={t} label={t} variant="theme" />
          ))}
          <TagBadge label={TEMPO_KO[tags.tempo]} variant="tempo" />
          <TagBadge label={DIFFICULTY_KO[tags.difficulty]} variant="difficulty" />
          {tags.strings && <TagBadge label="현악기" variant="strings" />}
          {tags.auto.map(a => (
            <TagBadge key={a} label={a} variant="auto" />
          ))}
        </div>
      </div>
    </Link>
  );
}
