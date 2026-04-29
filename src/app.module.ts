import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from './db/db.module'; // Import DbModule
import { RedisModule } from './redis/redis.module'; // Import RedisModule
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DbModule, // ✅ Add this - makes DRIZZLE available globally
    RedisModule, // ✅ Add this - makes REDIS_CLIENT available globally
    UserModule,
  ],
})
export class AppModule {}
