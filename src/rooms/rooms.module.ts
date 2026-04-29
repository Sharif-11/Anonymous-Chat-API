import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { UserModule } from '../user/user.module'; // Import UserModule
import { RoomsController } from './rooms.controller';
import { RoomsRepository } from './rooms.repository';
import { RoomsService } from './rooms.service';

@Module({
  imports: [RedisModule, UserModule], // Add UserModule here
  controllers: [RoomsController],
  providers: [RoomsService, RoomsRepository],
  exports: [RoomsService, RoomsRepository],
})
export class RoomsModule {}
