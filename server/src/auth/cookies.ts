import type { CookieOptions } from 'express';
import { config } from '../config.js';

export const AUTH_COOKIE = 'access_token';
export const STATE_COOKIE = 'oauth_state';
export const STATE_COOKIE_PATH = '/auth/google';

export function authCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.cookieSecure,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

export function stateCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.cookieSecure,
    path: STATE_COOKIE_PATH,
    maxAge: 10 * 60 * 1000,
  };
}

export function parseCookies(header?: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!header) return result;
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index < 0) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    try {
      result[key] = decodeURIComponent(value);
    } catch {
      result[key] = value;
    }
  }
  return result;
}
