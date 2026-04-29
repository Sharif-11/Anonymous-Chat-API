import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { UserModule } from '../user/user.module';
import { MessagesRepository } from './messages.repository';
import { RoomsController } from './rooms.controller';
import { RoomsRepository } from './rooms.repository';
import { RoomsService } from './rooms.service';

@Module({
  imports: [RedisModule, UserModule],
  controllers: [RoomsController],
  providers: [
    RoomsService,
    RoomsRepository,
    MessagesRepository, // Add messages repository
  ],
  exports: [RoomsService, RoomsRepository],
})
export class RoomsModule {}
