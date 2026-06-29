import { Link } from 'react-router-dom';
import type { RecommendedSong } from '../types';
import { TagBadge } from './TagBadge';
import { EncoreStatusBadge } from './EncoreStatusBadge';
import { TEMPO_KO, DIFFICULTY_KO } from '../types';
import clsx from 'clsx';

interface RecommendCardProps {
  song: RecommendedSong;
  rank: number;
}

function parseReason(r: string): React.ReactNode {
  // Convert **bold** and *italic* markdown to JSX
  return r.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="rounded bg-amber-100 px-1 text-amber-800 not-italic">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export function RecommendCard({ song, rank }: RecommendCardProps) {
  const ineligible = !song.eligible;

  return (
    <div
      className={clsx(
        'relative rounded-2xl border bg-white p-4 shadow-sm transition-all',
        ineligible
          ? 'border-gray-200 opacity-60'
          : rank === 1
          ? 'border-indigo-300 shadow-indigo-100'
          : 'border-gray-200 hover:border-indigo-200 hover:shadow-md',
      )}
    >
      {rank === 1 && !ineligible && (
        <span className="absolute -top-2 left-4 rounded-full bg-indigo-600 px-2.5 py-0.5 text-xs font-bold text-white">
          TOP 추천
        </span>
      )}

      <div className="flex gap-3">
        {/* Thumbnail */}
        <Link to={`/song/${song.id}`} className="shrink-0">
          <div className="relative h-16 w-28 overflow-hidden rounded-lg bg-gray-100">
            <img
              src={song.thumbnail}
              alt={song.title}
              className="h-full w-full object-cover"
              onError={e => {
                (e.target as HTMLImageElement).src =
                  `https://img.youtube.com/vi/${song.id}/mqdefault.jpg`;
              }}
            />
            {ineligible && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 text-xs font-bold text-white">
                {song.weeksRemaining}주 남음
              </div>
            )}
          </div>
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link
              to={`/song/${song.id}`}
              className="line-clamp-2 text-sm font-bold text-gray-900 hover:text-indigo-700"
            >
              {song.title}
            </Link>
            {!ineligible && (
              <span className="shrink-0 rounded-lg bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">
                {(song.score * 100).toFixed(0)}점
              </span>
            )}
          </div>

          {/* Reason chips */}
          <p className="mt-1 text-xs text-gray-500 leading-relaxed">
            {song.reasons.map((r, i) => (
              <span key={i}>
                {i > 0 && <span className="mx-1 text-gray-300">·</span>}
                {parseReason(r)}
              </span>
            ))}
          </p>

          <div className="mt-2">
            <EncoreStatusBadge encoreCount={song.derived.encoreCount} />
          </div>

          {/* Tags row */}
          <div className="mt-2 flex flex-wrap gap-1">
            {song.tags.theme.slice(0, 2).map(t => (
              <TagBadge key={t} label={t} variant="theme" />
            ))}
            {song.tags.mood.slice(0, 1).map(m => (
              <TagBadge key={m} label={m} variant="mood" />
            ))}
            <TagBadge label={TEMPO_KO[song.tags.tempo]} variant="tempo" />
            <TagBadge label={DIFFICULTY_KO[song.tags.difficulty]} variant="difficulty" />
            {song.tags.strings && <TagBadge label="🎻 현악기" variant="strings" />}
            {song.tags.auto.map(a => (
              <TagBadge key={a} label={a} variant="auto" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
