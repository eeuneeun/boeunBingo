import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { GameModule } from './game/game.module.js';
import { PrismaModule } from './prisma.module.js';

@Module({
  imports: [PrismaModule, AuthModule, GameModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
