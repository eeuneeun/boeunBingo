import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import type { User } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma.service.js';
import type { AuthUser, GoogleProfile, JwtPayload } from './auth.types.js';
import { AUTH_COOKIE, parseCookies } from './cookies.js';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async signup(input: { email: string; password: string; nickname: string }) {
    const email = input.email.trim().toLowerCase();
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) throw new ConflictException('이미 가입된 이메일입니다.');

    return this.prisma.user.create({
      data: {
        email,
        passwordHash: await hash(input.password, BCRYPT_ROUNDS),
        nickname: input.nickname.trim(),
      },
    });
  }

  async login(input: { email: string; password: string }) {
    const email = input.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    const ok = user?.passwordHash ? await compare(input.password, user.passwordHash) : false;
    if (!user || !ok) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }
    return user;
  }

  async loginWithGoogle(profile: GoogleProfile): Promise<User> {
    if (!profile.email || !profile.emailVerified) {
      throw new UnauthorizedException('인증된 이메일이 필요합니다.');
    }
    const email = profile.email.toLowerCase();

    const linked = await this.prisma.account.findUnique({
      where: {
        provider_providerAccountId: { provider: 'google', providerAccountId: profile.sub },
      },
      include: { user: true },
    });
    if (linked) return linked.user;

    let user = await this.prisma.user.findUnique({ where: { email } });
    if (user) {
      // 이메일 인증 없이 가입된 계정이면 선점 공격을 막기 위해 비밀번호를 지운다.
      if (!user.emailVerified) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: true, passwordHash: null },
        });
      }
    } else {
      user = await this.prisma.user.create({
        data: {
          email,
          emailVerified: true,
          nickname: (profile.name ?? email.split('@')[0]).slice(0, 12),
        },
      });
    }

    await this.prisma.account.create({
      data: { provider: 'google', providerAccountId: profile.sub, userId: user.id },
    });
    return user;
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  issueToken(user: Pick<User, 'id' | 'nickname'>): string {
    const payload: JwtPayload = { sub: user.id, nickname: user.nickname };
    return this.jwt.sign(payload);
  }

  userFromCookieHeader(header?: string): AuthUser | null {
    const token = parseCookies(header)[AUTH_COOKIE];
    if (!token) return null;
    try {
      const payload = this.jwt.verify<JwtPayload>(token);
      return { id: payload.sub, nickname: payload.nickname };
    } catch {
      return null;
    }
  }

  publicUser(user: Pick<User, 'id' | 'email' | 'nickname'>) {
    return { id: user.id, email: user.email, nickname: user.nickname };
  }
}
