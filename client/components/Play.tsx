'use client';

import { request } from '@/lib/socket';
import { useGame } from '@/store/gameStore';

export default function Play() {
  const room = useGame((s) => s.room)!;
  const myId = useGame((s) => s.myId);
  const error = useGame((s) => s.error);
  const setError = useGame((s) => s.setError);

  const marked = new Set(room.marked);
  const lastPicked = room.marked[room.marked.length - 1];
  const myTurn = room.phase === 'playing' && room.turnPlayerId === myId;
  const me = room.players.find((p) => p.id === myId);
  const opp = room.players.find((p) => p.id !== myId);

  const pick = async (n: number) => {
    setError(null);
    const res = await request('game:pick', { number: n });
    if (!res.ok) setError(res.error ?? '요청에 실패했습니다.');
  };

  let status = myTurn ? '내 차례입니다. 숫자를 고르세요.' : '상대의 차례입니다.';
  if (room.phase === 'finished') {
    if (room.winnerId === 'draw') status = '무승부입니다.';
    else status = room.winnerId === myId ? '승리했습니다!' : '패배했습니다.';
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div
          className={`rounded-lg border p-3 ${
            myTurn ? 'border-blue-500 bg-blue-50 text-blue-900' : 'border-gray-200 text-gray-700'
          }`}
        >
          <p className="font-medium">{me?.nickname} (나)</p>
          <p>{me?.lines ?? 0}줄 완성</p>
        </div>
        <div
          className={`rounded-lg border p-3 ${
            room.phase === 'playing' && !myTurn
              ? 'border-blue-500 bg-blue-50 text-blue-900'
              : 'border-gray-200 text-gray-700'
          }`}
        >
          <p className="font-medium">{opp?.nickname ?? '상대 없음'}</p>
          <p>{opp?.lines ?? 0}줄 완성</p>
        </div>
      </div>

      <p className="text-lg font-semibold">{status}</p>

      <div className="grid grid-cols-5 gap-1.5">
        {(room.myBoard ?? []).map((n) => {
          const isMarked = marked.has(n);
          const isLast = n === lastPicked;
          return (
            <button
              key={n}
              disabled={!myTurn || isMarked}
              onClick={() => pick(n)}
              className={[
                'flex aspect-square items-center justify-center rounded-lg border text-lg font-medium transition-colors',
                isMarked
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-gray-300 bg-white text-gray-900',
                isLast ? 'ring-2 ring-amber-400 ring-offset-2' : '',
                myTurn && !isMarked ? 'hover:bg-blue-50' : '',
                'disabled:cursor-not-allowed',
              ].join(' ')}
            >
              {n}
            </button>
          );
        })}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
