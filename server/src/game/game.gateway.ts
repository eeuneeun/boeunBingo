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

@WebSocketGateway({ cors: { origin: config.clientUrl, credentials: true } })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;

  private readonly leaveTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly rooms: RoomService,
    private readonly auth: AuthService,
  ) {}

  async handleConnection(client: Socket) {
    const user = this.auth.userFromCookieHeader(client.handshake.headers.cookie);
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
  join(@ConnectedSocket() client: Socket, @MessageBody() body: { roomId: string }) {
    return this.safe(() => {
      const user = this.userOf(client);
      this.broadcast(this.rooms.join(body?.roomId, user.id, user.nickname));
    });
  }

  @SubscribeMessage('game:ready')
  ready(@ConnectedSocket() client: Socket, @MessageBody() body: { board: number[] }) {
    return this.safe(() => {
      const user = this.userOf(client);
      this.broadcast(this.rooms.ready(user.id, body?.board));
    });
  }

  @SubscribeMessage('game:pick')
  pick(@ConnectedSocket() client: Socket, @MessageBody() body: { number: number }) {
    return this.safe(() => {
      const user = this.userOf(client);
      this.broadcast(this.rooms.pick(user.id, body?.number));
    });
  }

  @SubscribeMessage('room:leave')
  leave(@ConnectedSocket() client: Socket) {
    return this.safe(() => {
      const user = this.userOf(client);
      const room = this.rooms.leave(user.id);
      if (room) this.broadcast(room);
    });
  }

  private userOf(client: Socket): AuthUser {
    const user = client.data.user as AuthUser | undefined;
    if (!user) throw new Error('로그인이 필요합니다.');
    return user;
  }

  private broadcast(room: Room) {
    for (const p of room.players) {
      this.server.to(userRoom(p.id)).emit('room:state', this.rooms.viewFor(room, p.id));
    }
  }

  private safe(fn: () => void) {
    try {
      fn();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : '알 수 없는 오류' };
    }
  }
}
