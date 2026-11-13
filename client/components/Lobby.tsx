'use client';

import { useState } from 'react';
import { request } from '@/lib/socket';
import { useGame } from '@/store/gameStore';

export default function Lobby() {
  const [code, setCode] = useState('');
  const error = useGame((s) => s.error);
  const setError = useGame((s) => s.setError);

  const run = async (event: string, payload?: object) => {
    setError(null);
    const res = await request(event, payload);
    if (!res.ok) setError(res.error ?? '요청에 실패했습니다.');
  };

  return (
    <div className="space-y-5">
      <button
        className="w-full rounded-lg bg-blue-600 p-3 font-medium text-white hover:bg-blue-700"
        onClick={() => run('room:create')}
      >
        방 만들기
      </button>

      <div className="flex items-center gap-3 text-sm text-gray-400">
        <span className="h-px flex-1 bg-gray-200" />
        또는
        <span className="h-px flex-1 bg-gray-200" />
      </div>

      <div className="flex gap-2">
        <input
          className="min-w-0 flex-1 rounded-lg border border-gray-300 p-3 uppercase tracking-widest outline-none focus:border-blue-500"
          placeholder="방 코드"
          maxLength={4}
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button
          className="rounded-lg bg-gray-900 px-5 font-medium text-white hover:bg-black"
          onClick={() => run('room:join', { roomId: code })}
        >
          입장
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
