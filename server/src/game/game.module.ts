import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { GameGateway } from './game.gateway.js';
import { RoomService } from './room.service.js';

@Module({ imports: [AuthModule], providers: [GameGateway, RoomService] })
export class GameModule {}
