import { Injectable } from '@nestjs/common';
import { countLines, isValidBoard, SIZE, WIN_LINES } from './bingo.logic.js';
import type { Room, RoomView } from './game.types.js';

@Injectable()
export class RoomService {
  private readonly rooms = new Map<string, Room>();
  private readonly playerRoom = new Map<string, string>();

  create(playerId: string, nickname: string): Room {
    this.assertNotInRoom(playerId);
    const room: Room = {
      id: this.newId(),
      phase: 'waiting',
      players: [{ id: playerId, nickname: this.cleanName(nickname), board: null, ready: false }],
      marked: [],
      turnIndex: 0,
      winnerId: null,
    };
    this.rooms.set(room.id, room);
    this.playerRoom.set(playerId, room.id);
    return room;
  }

  join(roomId: string, playerId: string, nickname: string): Room {
    this.assertNotInRoom(playerId);
    const room = this.rooms.get(String(roomId ?? '').toUpperCase());
    if (!room) throw new Error('존재하지 않는 방입니다.');
    if (room.phase !== 'waiting' || room.players.length >= 2) {
      throw new Error('입장할 수 없는 방입니다.');
    }
    room.players.push({ id: playerId, nickname: this.cleanName(nickname), board: null, ready: false });
    this.playerRoom.set(playerId, room.id);
    return room;
  }

  findByPlayer(playerId: string): Room | null {
    const roomId = this.playerRoom.get(playerId);
    return roomId ? (this.rooms.get(roomId) ?? null) : null;
  }

  ready(playerId: string, board: unknown): Room {
    const room = this.roomOf(playerId);
    if (room.phase !== 'waiting') throw new Error('이미 시작된 게임입니다.');
    if (!isValidBoard(board)) throw new Error('올바르지 않은 보드입니다.');
    const me = room.players.find((p) => p.id === playerId)!;
    me.board = board;
    me.ready = true;
    if (room.players.length === 2 && room.players.every((p) => p.ready)) {
      room.phase = 'playing';
      room.turnIndex = Math.floor(Math.random() * 2);
    }
    return room;
  }

  pick(playerId: string, number: unknown): Room {
    const room = this.roomOf(playerId);
    if (room.phase !== 'playing') throw new Error('게임이 진행 중이 아닙니다.');
    if (room.players[room.turnIndex].id !== playerId) throw new Error('내 차례가 아닙니다.');
    if (typeof number !== 'number' || !Number.isInteger(number) || number < 1 || number > SIZE * SIZE) {
      throw new Error('올바르지 않은 숫자입니다.');
    }
    if (room.marked.includes(number)) throw new Error('이미 선택된 숫자입니다.');

    room.marked.push(number);
    const marked = new Set(room.marked);
    const winners = room.players.filter((p) => countLines(p.board!, marked) >= WIN_LINES);

    if (winners.length === 2) {
      room.phase = 'finished';
      room.winnerId = 'draw';
    } else if (winners.length === 1) {
      room.phase = 'finished';
      room.winnerId = winners[0].id;
    } else {
      room.turnIndex = 1 - room.turnIndex;
    }
    return room;
  }

  leave(playerId: string): Room | null {
    const roomId = this.playerRoom.get(playerId);
    if (!roomId) return null;
    this.playerRoom.delete(playerId);
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.players = room.players.filter((p) => p.id !== playerId);
    if (room.players.length === 0) {
      this.rooms.delete(roomId);
      return null;
    }
    if (room.phase === 'playing') {
      room.phase = 'finished';
      room.winnerId = room.players[0].id; // 상대가 나가면 기권승
    } else if (room.phase === 'waiting') {
      room.players.forEach((p) => (p.ready = false));
    }
    return room;
  }

  viewFor(room: Room, viewerId: string): RoomView {
    const marked = new Set(room.marked);
    const me = room.players.find((p) => p.id === viewerId);
    return {
      id: room.id,
      phase: room.phase,
      marked: room.marked,
      turnPlayerId: room.phase === 'playing' ? (room.players[room.turnIndex]?.id ?? null) : null,
      winnerId: room.winnerId,
      myBoard: me?.board ?? null,
      players: room.players.map((p) => ({
        id: p.id,
        nickname: p.nickname,
        ready: p.ready,
        lines: p.board ? countLines(p.board, marked) : 0,
      })),
    };
  }

  private roomOf(playerId: string): Room {
    const room = this.rooms.get(this.playerRoom.get(playerId) ?? '');
    if (!room) throw new Error('참여 중인 방이 없습니다.');
    return room;
  }

  private assertNotInRoom(playerId: string) {
    if (this.playerRoom.has(playerId)) throw new Error('이미 방에 참여 중입니다.');
  }

  private cleanName(nickname: string): string {
    return String(nickname ?? '').trim().slice(0, 12) || '플레이어';
  }

  private newId(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 헷갈리는 글자(O, 0, I, 1) 제외
    let id: string;
    do {
      id = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    } while (this.rooms.has(id));
    return id;
  }
}
