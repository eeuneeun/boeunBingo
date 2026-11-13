import { create } from 'zustand';

export interface RoomView {
  id: string;
  phase: 'waiting' | 'playing' | 'finished';
  marked: number[];
  turnPlayerId: string | null;
  winnerId: string | null;
  myBoard: number[] | null;
  players: { id: string; nickname: string; ready: boolean; lines: number }[];
}

interface GameStore {
  connected: boolean;
  myId: string | null;
  room: RoomView | null;
  error: string | null;
  setConnected: (connected: boolean, myId: string | null) => void;
  setRoom: (room: RoomView | null) => void;
  setError: (error: string | null) => void;
}

export const useGame = create<GameStore>((set) => ({
  connected: false,
  myId: null,
  room: null,
  error: null,
  setConnected: (connected, myId) => set({ connected, myId }),
  setRoom: (room) => set({ room }),
  setError: (error) => set({ error }),
}));
