import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { Response } from 'express';
import { config } from '../config.js';
import { LoginDto, SignupDto } from './auth.dto.js';
import { AuthService } from './auth.service.js';
import type { AuthedRequest } from './auth.types.js';
import {
  AUTH_COOKIE,
  STATE_COOKIE,
  STATE_COOKIE_PATH,
  authCookieOptions,
  parseCookies,
  stateCookieOptions,
} from './cookies.js';
import { GoogleService } from './google.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly google: GoogleService,
  ) {}

  @Post('signup')
  async signup(@Body() dto: SignupDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.auth.signup(dto);
    res.cookie(AUTH_COOKIE, this.auth.issueToken(user), authCookieOptions());
    return this.auth.publicUser(user);
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.auth.login(dto);
    res.cookie(AUTH_COOKIE, this.auth.issueToken(user), authCookieOptions());
    return this.auth.publicUser(user);
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(AUTH_COOKIE, { path: '/' });
    return { ok: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: AuthedRequest) {
    const user = await this.auth.findById(req.user!.id);
    if (!user) throw new UnauthorizedException('로그인이 필요합니다.');
    return this.auth.publicUser(user);
  }

  @Get('google')
  googleStart(@Res() res: Response) {
    if (!this.google.enabled) {
      return res.redirect(`${config.clientUrl}/?error=google_disabled`);
    }
    const state = randomBytes(16).toString('hex');
    res.cookie(STATE_COOKIE, state, stateCookieOptions());
    return res.redirect(this.google.authUrl(state));
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Req() req: AuthedRequest,
    @Res() res: Response,
  ) {
    const saved = parseCookies(req.headers.cookie)[STATE_COOKIE];
    res.clearCookie(STATE_COOKIE, { path: STATE_COOKIE_PATH });

    if (!code || !state || !saved || state !== saved) {
      return res.redirect(`${config.clientUrl}/?error=google`);
    }

    try {
      const profile = await this.google.profileFromCode(code);
      const user = await this.auth.loginWithGoogle(profile);
      res.cookie(AUTH_COOKIE, this.auth.issueToken(user), authCookieOptions());
      return res.redirect(config.clientUrl);
    } catch {
      return res.redirect(`${config.clientUrl}/?error=google`);
    }
  }
}
