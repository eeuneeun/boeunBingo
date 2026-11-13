'use client';

import Lobby from '@/components/Lobby';
import Play from '@/components/Play';
import Setup from '@/components/Setup';
import { useGameSocket } from '@/hooks/useGameSocket';
import { request } from '@/lib/socket';
import { useAuth } from '@/store/authStore';
import { useGame } from '@/store/gameStore';

export default function GameApp() {
  const user = useAuth((s) => s.user)!;
  const logout = useAuth((s) => s.logout);
  useGameSocket(user.id);

  const connected = useGame((s) => s.connected);
  const room = useGame((s) => s.room);
  const setRoom = useGame((s) => s.setRoom);

  const leave = async () => {
    await request('room:leave');
    setRoom(null);
  };

  const signOut = async () => {
    await request('room:leave');
    await logout();
  };

  return (
    <main className="mx-auto max-w-md space-y-4 p-6">
      <header className="flex items-center justify-between text-sm">
        <span className="font-medium">{user.nickname}</span>
        <button className="text-gray-500 underline" onClick={signOut}>
          로그아웃
        </button>
      </header>

      {!connected ? (
        <p className="text-gray-500">서버에 연결하는 중...</p>
      ) : (
        <>
          {!room ? <Lobby /> : room.phase === 'waiting' ? <Setup /> : <Play />}
          {room && (
            <button
              className="w-full rounded-lg border border-gray-300 p-3 text-gray-700 hover:bg-gray-50"
              onClick={leave}
            >
              방 나가기
            </button>
          )}
        </>
      )}
    </main>
  );
}
