import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface InlineUnlockProps {
  onUnlocked?: () => void;
  onCancel?: () => void;
}

/**
 * Compact password prompt shown in place, so editing never requires
 * navigating to another tab first just to authenticate.
 */
export function InlineUnlock({ onUnlocked, onCancel }: InlineUnlockProps) {
  const { loading, error, login } = useAuth();
  const [pw, setPw] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await login(pw);
    if (ok) {
      setPw('');
      onUnlocked?.();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 space-y-3"
    >
      <div>
        <p className="text-sm font-semibold text-indigo-900">편집 잠금 해제</p>
        <p className="text-xs text-indigo-700">곡 정보를 수정하려면 비밀번호를 입력하세요.</p>
      </div>
      <input
        type="password"
        value={pw}
        onChange={e => setPw(e.target.value)}
        placeholder="비밀번호"
        autoFocus
        className="w-full rounded-xl border border-indigo-300 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading || !pw}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? '확인 중…' : '잠금 해제'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-indigo-200 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
          >
            취소
          </button>
        )}
      </div>
    </form>
  );
}
