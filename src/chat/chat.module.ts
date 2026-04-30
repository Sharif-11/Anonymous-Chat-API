import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { UserModule } from '../user/user.module';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [UserModule, RedisModule], // Removed RoomsModule
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class ChatModule {}
