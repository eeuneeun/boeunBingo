import { io } from 'socket.io-client';
import { SERVER_URL } from '@/lib/api';

export const socket = io(SERVER_URL, {
  autoConnect: false,
  withCredentials: true, // 로그인 쿠키를 소켓 연결에도 함께 보낸다.
});

export interface Ack {
  ok: boolean;
  error?: string;
}

export function request(event: string, payload?: unknown): Promise<Ack> {
  return new Promise((resolve) => {
    socket.timeout(5000).emit(event, payload, (err: Error | null, res: Ack) => {
      if (err) resolve({ ok: false, error: '서버 응답이 없습니다.' });
      else resolve(res);
    });
  });
}
