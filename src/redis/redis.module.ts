import { Global, Module } from '@nestjs/common';
import { createClient } from 'redis';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: async () => {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        console.log(`🔄 Connecting to Redis at ${redisUrl}`);

        const client = createClient({
          url: redisUrl,
        });

        client.on('error', (err) => console.error('Redis Client Error:', err));
        client.on('connect', () =>
          console.log('✅ Redis connected successfully'),
        );

        await client.connect();
        return client;
      },
    },
  ],
  exports: ['REDIS_CLIENT'], // Only export the client, not the service
})
export class RedisModule {}
