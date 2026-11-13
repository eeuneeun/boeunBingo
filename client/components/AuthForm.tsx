'use client';

import { useEffect, useState } from 'react';
import { SERVER_URL } from '@/lib/api';
import { useAuth } from '@/store/authStore';

const QUERY_ERRORS: Record<string, string> = {
  google: '구글 로그인에 실패했습니다. 다시 시도해 주세요.',
  google_disabled: '구글 로그인이 아직 설정되지 않았습니다.',
};

export default function AuthForm() {
  const login = useAuth((s) => s.login);
  const signup = useAuth((s) => s.signup);

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // 구글 로그인 실패 시 서버가 ?error=... 로 돌려보낸다.
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('error');
    if (code) {
      setError(QUERY_ERRORS[code] ?? '로그인에 실패했습니다.');
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const submit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const message =
      mode === 'login' ? await login(email, password) : await signup(email, password, nickname);
    setBusy(false);
    if (message) setError(message);
  };

  const input =
    'w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500';

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-bold tracking-tight">빙고</h1>

      <a
        href={`${SERVER_URL}/auth/google`}
        className="flex w-full items-center justify-center rounded-lg border border-gray-300 p-3 font-medium hover:bg-gray-50"
      >
        구글로 계속하기
      </a>

      <div className="flex items-center gap-3 text-sm text-gray-400">
        <span className="h-px flex-1 bg-gray-200" />
        또는 이메일로
        <span className="h-px flex-1 bg-gray-200" />
      </div>

      <form onSubmit={submit} className="space-y-3">
        {mode === 'signup' && (
          <input
            className={input}
            placeholder="닉네임 (1~12자)"
            maxLength={12}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
          />
        )}
        <input
          className={input}
          type="email"
          placeholder="이메일"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className={input}
          type="password"
          placeholder={mode === 'signup' ? '비밀번호 (8자 이상)' : '비밀번호'}
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-blue-600 p-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {mode === 'login' ? '로그인' : '가입하기'}
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        className="w-full text-sm text-gray-500 underline"
        onClick={() => {
          setMode(mode === 'login' ? 'signup' : 'login');
          setError(null);
        }}
      >
        {mode === 'login' ? '계정이 없나요? 가입하기' : '이미 계정이 있나요? 로그인'}
      </button>
    </div>
  );
}
