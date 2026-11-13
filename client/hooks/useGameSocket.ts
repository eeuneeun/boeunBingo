'use client';

import { useEffect } from 'react';
import { socket } from '@/lib/socket';
import { useAuth } from '@/store/authStore';
import { RoomView, useGame } from '@/store/gameStore';

export function useGameSocket(userId: string) {
  useEffect(() => {
    const { setConnected, setRoom } = useGame.getState();

    const onConnect = () => setConnected(true, userId);
    const onDisconnect = () => {
      setConnected(false, null);
      setRoom(null); // 재연결되면 서버가 현재 방 상태를 다시 보내 준다.
    };
    const onState = (room: RoomView) => setRoom(room);
    const onAuthError = () => useAuth.getState().expire();

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('room:state', onState);
    socket.on('auth:error', onAuthError);
    socket.connect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room:state', onState);
      socket.off('auth:error', onAuthError);
      socket.disconnect();
      setConnected(false, null);
      setRoom(null);
    };
  }, [userId]);
}
