import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from './db/db.module';

import { RedisModule } from './redis/redis.module';
import { RoomsModule } from './rooms/rooms.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DbModule,
    RedisModule, // ✅ Make sure RedisModule is before RoomsModule
    UserModule,
    RoomsModule,
  ],
})
export class AppModule {}
