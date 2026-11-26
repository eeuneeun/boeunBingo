import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service.js';
import type { AuthUser } from '../auth/auth.types.js';
import { config } from '../config.js';
import type { Room } from './game.types.js';
import { RoomService } from './room.service.js';

const RECONNECT_GRACE_MS = 30_000;
const userRoom = (userId: string) => `user:${userId}`;

@WebSocketGateway({
  cors: {
    origin: ['http://bingo.io.kr', 'https://bingo.io.kr', config.clientUrl],
    credentials: true,
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;

  private readonly leaveTimers = new Map<string, NodeJS.Timeout>();
  private readonly lastChatAt = new Map<string, number>(); // 채팅 도배 방지용

  constructor(
    private readonly rooms: RoomService,
    private readonly auth: AuthService,
  ) {}

  async handleConnection(client: Socket) {
    const user = this.auth.userFromCookieHeader(
      client.handshake.headers.cookie,
    );
    if (!user) {
      client.emit('auth:error');
      client.disconnect(true);
      return;
    }
    client.data.user = user;
    await client.join(userRoom(user.id));

    // 재접속: 대기 중이던 퇴장 타이머를 취소하고 현재 방 상태를 다시 내려준다.
    const timer = this.leaveTimers.get(user.id);
    if (timer) {
      clearTimeout(timer);
      this.leaveTimers.delete(user.id);
    }
    const room = this.rooms.findByPlayer(user.id);
    if (room) this.broadcast(room);
  }

  async handleDisconnect(client: Socket) {
    const user = client.data.user as AuthUser | undefined;
    if (!user) return;

    // 같은 계정의 다른 탭이 남아 있으면 그대로 둔다.
    const remaining = await this.server.in(userRoom(user.id)).fetchSockets();
    if (remaining.length > 0) return;

    const timer = setTimeout(() => {
      this.leaveTimers.delete(user.id);
      this.lastChatAt.delete(user.id); // 채팅창 타임아웃
      const room = this.rooms.leave(user.id);
      if (room) this.broadcast(room);
    }, RECONNECT_GRACE_MS);
    this.leaveTimers.set(user.id, timer);
  }

  @SubscribeMessage('room:create')
  create(@ConnectedSocket() client: Socket) {
    return this.safe(() => {
      const user = this.userOf(client);
      this.broadcast(this.rooms.create(user.id, user.nickname));
    });
  }

  @SubscribeMessage('room:join')
  join(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { roomId: string },
  ) {
    return this.safe(() => {
      const user = this.userOf(client);
      // 서비스가 방 ID를 대문자로 바꿔 찾으니 여기서도 똑같이 맞춰서 비교
      const targetId = String(body?.roomId ?? '').toUpperCase();

      const existing = this.rooms.findByPlayer(user.id);
      if (existing) {
        if (existing.id === targetId) {
          this.broadcast(existing); // 같은 방 재요청: 상태만 다시 내려주고 안내는 생략
          return;
        }
        throw new Error('이미 다른 방에 참여 중입니다.');
      }

      const room = this.rooms.join(targetId, user.id, user.nickname);
      this.broadcast(room); // rooms.join은 딱 한 번만 호출
      this.announce(room, `${user.nickname}님이 입장했습니다.`);
    });
  }

  @SubscribeMessage('game:ready')
  ready(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { board: number[] },
  ) {
    return this.safe(() => {
      const user = this.userOf(client);
      const prev = this.rooms.findByPlayer(user.id);
      const before = this.rooms.findByPlayer(user.id)?.phase;
      const wasReady =
        prev?.players.find((p) => p.id === user.id)?.ready ?? false;
      const room = this.rooms.ready(user.id, body?.board);
      this.broadcast(room);

      if (!wasReady) {
        this.announce(room, `${user.nickname}님이 준비를 완료했습니다.`);
      }
      if (before !== 'playing' && room.phase === 'playing') {
        this.announce(room, '게임이 시작되었습니다!');
      }
    });
  }

  @SubscribeMessage('game:pick')
  pick(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { number: number },
  ) {
    return this.safe(() => {
      const user = this.userOf(client);
      const before = this.rooms.findByPlayer(user.id)?.phase;
      const room = this.rooms.pick(user.id, body?.number);
      this.broadcast(room);
      if (before !== 'finished' && room.phase === 'finished') {
        if (room.winnerId === 'draw') {
          this.announce(room, '무승부로 게임이 종료되었습니다.');
        } else {
          const winner = room.players.find((p) => p.id === room.winnerId);
          this.announce(
            room,
            winner
              ? `${winner.nickname}님이 승리했습니다!`
              : '게임이 종료되었습니다.',
          );
        }
      }
    });
  }

  @SubscribeMessage('room:leave')
  leave(@ConnectedSocket() client: Socket) {
    return this.safe(() => {
      const user = this.userOf(client);
      const room = this.rooms.leave(user.id);
      if (room) {
        this.broadcast(room);
        this.announce(room, `${user.nickname}님이 퇴장했습니다.`);
      }
    });
  }

  @SubscribeMessage('chat:send')
  chat(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { message: string },
  ) {
    return this.safe(() => {
      const user = this.userOf(client);

      const text = String(body?.message ?? '')
        .trim()
        .slice(0, 200);
      if (!text) throw new Error('메시지를 입력해주세요.');

      const room = this.rooms.findByPlayer(user.id);
      if (!room) throw new Error('방에 참가 중이 아닙니다.');

      const now = Date.now();
      if (now - (this.lastChatAt.get(user.id) ?? 0) < 500) {
        throw new Error('너무 빠르게 보내고 있어요.');
      }
      this.lastChatAt.set(user.id, now);

      const payload = {
        id: `${now}-${user.id}`,
        type: 'user' as const, // 추가
        userId: user.id,
        nickname: user.nickname,
        message: text,
        at: now,
      };
      for (const p of room.players) {
        this.server.to(userRoom(p.id)).emit('chat:message', payload);
      }
    });
  }

  private userOf(client: Socket): AuthUser {
    const user = client.data.user as AuthUser | undefined;
    if (!user) throw new Error('로그인이 필요합니다.');
    return user;
  }

  private broadcast(room: Room) {
    for (const p of room.players) {
      this.server
        .to(userRoom(p.id))
        .emit('room:state', this.rooms.viewFor(room, p.id));
    }
  }

  private announce(room: Room, text: string) {
    const now = Date.now();
    const payload = {
      id: `sys-${now}-${Math.random().toString(36).slice(2, 8)}`,
      type: 'system' as const,
      message: text,
      at: now,
    };
    for (const p of room.players) {
      this.server.to(userRoom(p.id)).emit('chat:message', payload);
    }
  }

  private safe(fn: () => void) {
    try {
      fn();
      return { ok: true };
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : '알 수 없는 오류',
      };
    }
  }
}
