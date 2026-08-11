import { useState, useCallback, useEffect } from 'react';
import { verifyPassword } from '../lib/api';

// Auth lives in sessionStorage, but every useAuth() call used to keep its own
// useState copy — so logging in from one component (e.g. an inline edit form)
// left every other component still believing it was logged out until remount.
// A module-level subscriber set keeps all instances in sync.
const listeners = new Set<() => void>();

function readAuthed(): boolean {
  return sessionStorage.getItem('rechoir_auth') === '1';
}

function notifyAuthChanged() {
  listeners.forEach(listener => listener());
}

export function useAuth() {
  const [authed, setAuthed] = useState(readAuthed);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const sync = () => setAuthed(readAuthed());
    listeners.add(sync);
    sync();
    return () => {
      listeners.delete(sync);
    };
  }, []);

  const login = useCallback(async (password: string): Promise<boolean> => {
    setLoading(true);
    setError('');
    try {
      const ok = await verifyPassword(password);
      if (ok) {
        sessionStorage.setItem('rechoir_auth', '1');
        sessionStorage.setItem('rechoir_pw', password);
        notifyAuthChanged();
      } else {
        setError('비밀번호가 올바르지 않습니다.');
      }
      return ok;
    } catch {
      setError('오류가 발생했습니다. 다시 시도해 주세요.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('rechoir_auth');
    sessionStorage.removeItem('rechoir_pw');
    notifyAuthChanged();
  }, []);

  const getPassword = useCallback((): string => {
    return sessionStorage.getItem('rechoir_pw') ?? '';
  }, []);

  return { authed, loading, error, login, logout, getPassword };
}
