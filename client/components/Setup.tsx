'use client';

import { useState } from 'react';
import { request } from '@/lib/socket';
import { useGame } from '@/store/gameStore';

function shuffled(): number[] {
  const a = Array.from({ length: 25 }, (_, i) => i + 1);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Setup() {
  const room = useGame((s) => s.room)!;
  const myId = useGame((s) => s.myId);
  const error = useGame((s) => s.error);
  const setError = useGame((s) => s.setError);
  const [board, setBoard] = useState<number[]>(shuffled);

  const me = room.players.find((p) => p.id === myId);
  const ready = me?.ready ?? false;
  const shown = ready && room.myBoard ? room.myBoard : board;

  const sendReady = async () => {
    setError(null);
    const res = await request('game:ready', { board });
    if (!res.ok) setError(res.error ?? '요청에 실패했습니다.');
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-gray-500">방 코드</p>
        <h2 className="text-3xl font-bold tracking-[0.3em]">{room.id}</h2>
      </div>

      <ul className="space-y-1 text-sm">
        {room.players.map((p) => (
          <li key={p.id} className="flex justify-between">
            <span>
              {p.nickname}
              {p.id === myId && ' (나)'}
            </span>
            <span className={p.ready ? 'text-green-600' : 'text-gray-400'}>
              {p.ready ? '준비 완료' : '준비 중'}
            </span>
          </li>
        ))}
        {room.players.length < 2 && (
          <li className="text-gray-400">상대가 들어오기를 기다리는 중...</li>
        )}
      </ul>

      <div className="grid grid-cols-5 gap-1.5">
        {shown.map((n) => (
          <div
            key={n}
            className="flex aspect-square items-center justify-center rounded-lg border border-gray-300 bg-white text-lg font-medium text-gray-900"
          >
            {n}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          className="flex-1 rounded-lg border border-gray-300 p-3 disabled:opacity-40"
          disabled={ready}
          onClick={() => setBoard(shuffled())}
        >
          다시 섞기
        </button>
        <button
          className="flex-1 rounded-lg bg-blue-600 p-3 font-medium text-white disabled:opacity-40"
          disabled={ready}
          onClick={sendReady}
        >
          준비 완료
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
