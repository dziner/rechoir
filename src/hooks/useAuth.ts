import { useState, useCallback } from 'react';
import { verifyPassword } from '../lib/api';

export function useAuth() {
  const [authed, setAuthed] = useState(() => {
    return sessionStorage.getItem('rechoir_auth') === '1';
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = useCallback(async (password: string): Promise<boolean> => {
    setLoading(true);
    setError('');
    try {
      const ok = await verifyPassword(password);
      if (ok) {
        sessionStorage.setItem('rechoir_auth', '1');
        sessionStorage.setItem('rechoir_pw', password);
        setAuthed(true);
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
    setAuthed(false);
  }, []);

  const getPassword = useCallback((): string => {
    return sessionStorage.getItem('rechoir_pw') ?? '';
  }, []);

  return { authed, loading, error, login, logout, getPassword };
}
