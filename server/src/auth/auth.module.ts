import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { config } from '../config.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { GoogleService } from './google.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

@Module({
  imports: [JwtModule.register({ secret: config.jwtSecret, signOptions: { expiresIn: '7d' } })],
  controllers: [AuthController],
  providers: [AuthService, GoogleService, JwtAuthGuard],
  exports: [AuthService],
})
export class AuthModule {}
