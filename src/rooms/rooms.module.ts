import { Module } from '@nestjs/common';
import { ChatModule } from '../chat/chat.module';
import { RedisModule } from '../redis/redis.module';
import { UserModule } from '../user/user.module';
import { MessagesRepository } from './messages.repository';
import { RoomsController } from './rooms.controller';
import { RoomsRepository } from './rooms.repository';
import { RoomsService } from './rooms.service';

@Module({
  imports: [RedisModule, UserModule, ChatModule], // No forwardRef needed
  controllers: [RoomsController],
  providers: [RoomsService, RoomsRepository, MessagesRepository],
  exports: [RoomsService, RoomsRepository],
})
export class RoomsModule {}
