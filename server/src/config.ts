function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`환경변수 ${name}이(가) 설정되지 않았습니다. server/.env를 확인하세요.`);
  return value;
}

export const config = {
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:3000',
  jwtSecret: required('JWT_SECRET'),
  // HTTPS 환경에서는 true. IP 주소로 http 테스트를 할 때만 COOKIE_SECURE=false 로 끈다.
  cookieSecure:
    process.env.COOKIE_SECURE !== undefined
      ? process.env.COOKIE_SECURE === 'true'
      : process.env.NODE_ENV === 'production',
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    callbackUrl:
      process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:4000/auth/google/callback',
  },
};
