import { create } from 'zustand';
import { api } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  nickname: string;
}

interface AuthStore {
  status: 'loading' | 'anon' | 'authed';
  user: User | null;
  fetchMe: () => Promise<void>;
  login: (email: string, password: string) => Promise<string | null>;
  signup: (email: string, password: string, nickname: string) => Promise<string | null>;
  logout: () => Promise<void>;
  expire: () => void;
}

export const useAuth = create<AuthStore>((set) => ({
  status: 'loading',
  user: null,

  fetchMe: async () => {
    const res = await api<User>('/auth/me');
    set(res.ok ? { status: 'authed', user: res.data } : { status: 'anon', user: null });
  },

  // 성공하면 null, 실패하면 오류 메시지를 돌려준다.
  login: async (email, password) => {
    const res = await api<User>('/auth/login', { body: { email, password } });
    if (!res.ok) return res.error;
    set({ status: 'authed', user: res.data });
    return null;
  },

  signup: async (email, password, nickname) => {
    const res = await api<User>('/auth/signup', { body: { email, password, nickname } });
    if (!res.ok) return res.error;
    set({ status: 'authed', user: res.data });
    return null;
  },

  logout: async () => {
    await api('/auth/logout', { method: 'POST', body: {} });
    set({ status: 'anon', user: null });
  },

  expire: () => set({ status: 'anon', user: null }),
}));
