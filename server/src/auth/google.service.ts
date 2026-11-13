import { Injectable } from '@nestjs/common';
import { config } from '../config.js';
import type { GoogleProfile } from './auth.types.js';

@Injectable()
export class GoogleService {
  get enabled(): boolean {
    return Boolean(config.google.clientId && config.google.clientSecret);
  }

  authUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: config.google.clientId,
      redirect_uri: config.google.callbackUrl,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      prompt: 'select_account',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async profileFromCode(code: string): Promise<GoogleProfile> {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: config.google.clientId,
        client_secret: config.google.clientSecret,
        redirect_uri: config.google.callbackUrl,
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenRes.ok) throw new Error('구글 토큰 교환에 실패했습니다.');
    const { access_token } = (await tokenRes.json()) as { access_token: string };

    const infoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!infoRes.ok) throw new Error('구글 프로필 조회에 실패했습니다.');
    const info = (await infoRes.json()) as {
      sub: string;
      email?: string;
      email_verified?: boolean;
      name?: string;
    };

    return {
      sub: info.sub,
      email: info.email,
      emailVerified: info.email_verified === true,
      name: info.name,
    };
  }
}
