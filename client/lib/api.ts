export const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:4000';

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

export async function api<T>(
  path: string,
  options: { method?: 'GET' | 'POST'; body?: unknown } = {},
): Promise<ApiResult<T>> {
  const method = options.method ?? (options.body !== undefined ? 'POST' : 'GET');
  try {
    const res = await fetch(`${SERVER_URL}${path}`, {
      method,
      credentials: 'include',
      headers: options.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const message = json?.message;
      return {
        ok: false,
        error: Array.isArray(message) ? message[0] : (message ?? '요청에 실패했습니다.'),
      };
    }
    return { ok: true, data: json as T };
  } catch {
    return { ok: false, error: '서버에 연결할 수 없습니다.' };
  }
}
