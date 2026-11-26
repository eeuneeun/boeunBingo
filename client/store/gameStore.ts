import { create } from "zustand";

export type ChatMsg =
  | {
      id: string;
      type: "user";
      userId: string;
      nickname: string;
      message: string;
      at: number;
    }
  | { id: string; type: "system"; message: string; at: number };

export interface RoomView {
  id: string;
  phase: "waiting" | "playing" | "finished";
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
  messages: ChatMsg[];
  chatRoomId: string | null;
  addMessage: (m: ChatMsg) => void;
  clearMessages: () => void;
}

export const useGame = create<GameStore>((set) => ({
  connected: false,
  myId: null,
  room: null,
  error: null,

  messages: [],
  chatRoomId: null,

  setConnected: (connected, myId) => set({ connected, myId }),
  setRoom: (room) =>
    set((s) => {
      if (room && room.id !== s.chatRoomId) {
        return { room, chatRoomId: room.id, messages: [] };
      }
      return { room };
    }),
  setError: (error) => set({ error }),

  addMessage: (m) => set((s) => ({ messages: [...s.messages.slice(-99), m] })),
  clearMessages: () => set({ messages: [], chatRoomId: null }),
}));
