import { io } from "socket.io-client";

const serverUrls = (process.env.NEXT_PUBLIC_SERVER_DOMAIN_URLS || "")
  .split(",")
  .map((u) => u.trim())
  .filter(Boolean);

const isHttps =
  typeof window !== "undefined" && window.location.protocol === "https:";
const resolvedServerUrl =
  (isHttps ? serverUrls.find((u) => u.startsWith("https://")) : undefined) ??
  serverUrls[0] ??
  serverUrls[1] ??
  "http://localhost:4000";

export const socket = io(resolvedServerUrl, {
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
      if (err) resolve({ ok: false, error: "서버 응답이 없습니다." });
      else resolve(res);
    });
  });
}
