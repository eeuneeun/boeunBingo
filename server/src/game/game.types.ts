export type Phase = 'waiting' | 'playing' | 'finished';

export interface Player {
  id: string;
  nickname: string;
  board: number[] | null;
  ready: boolean;
}

export interface Room {
  id: string;
  phase: Phase;
  players: Player[];
  marked: number[];
  turnIndex: number;
  winnerId: string | null; // 'draw'면 무승부
}

export interface RoomView {
  id: string;
  phase: Phase;
  marked: number[];
  turnPlayerId: string | null;
  winnerId: string | null;
  myBoard: number[] | null;
  players: { id: string; nickname: string; ready: boolean; lines: number }[];
}
