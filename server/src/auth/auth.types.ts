import type { Request } from 'express';

export interface JwtPayload {
  sub: string;
  nickname: string;
}

export interface AuthUser {
  id: string;
  nickname: string;
}

export interface AuthedRequest extends Request {
  user?: AuthUser;
}

export interface GoogleProfile {
  sub: string;
  email?: string;
  emailVerified: boolean;
  name?: string;
}
