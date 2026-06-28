import { type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import clsx from 'clsx';

const NAV = [
  { to: '/', label: '추천', icon: '✨' },
  { to: '/library', label: '라이브러리', icon: '🎵' },
  { to: '/record', label: '기록', icon: '📝' },
  { to: '/settings', label: '설정', icon: '⚙️' },
];

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { authed, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Top header */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-indigo-700">REchoir</span>
            <span className="hidden text-xs text-gray-400 sm:block">산위의마을교회 성가대</span>
          </Link>
          {authed && (
            <button
              onClick={logout}
              className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200"
            >
              로그아웃
            </button>
          )}
        </div>
      </header>

      {/* Page content */}
      <main className="mx-auto max-w-2xl px-4 py-6">{children}</main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl">
          {NAV.map(item => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={clsx(
                  'flex flex-1 flex-col items-center gap-0.5 py-3 text-xs font-medium transition-colors',
                  active ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-800',
                )}
              >
                <span className="text-lg leading-none">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
