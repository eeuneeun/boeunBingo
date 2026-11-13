import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import type { AuthedRequest } from './auth.types.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const user = this.auth.userFromCookieHeader(req.headers.cookie);
    if (!user) throw new UnauthorizedException('로그인이 필요합니다.');
    req.user = user;
    return true;
  }
}
