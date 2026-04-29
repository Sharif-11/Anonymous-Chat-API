import { Global, Module } from '@nestjs/common';
import { createClient } from 'redis';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: async () => {
        const client = createClient({
          url: process.env.REDIS_URL || 'redis://localhost:6379',
        });

        client.on('error', (err) => console.error('Redis Client Error:', err));
        client.on('connect', () => console.log('✅ Redis connected'));

        await client.connect();
        return client;
      },
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
