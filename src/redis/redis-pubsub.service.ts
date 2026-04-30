import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createClient } from 'redis';

@Injectable()
export class RedisPubSubService implements OnModuleInit, OnModuleDestroy {
  private pubClient: any;
  private subClient: any;

  async onModuleInit() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      console.log(`🔄 Initializing Redis Pub/Sub with URL: ${redisUrl}`);

      // Create dedicated pub/sub clients
      this.pubClient = createClient({
        url: redisUrl,
      });

      this.subClient = this.pubClient.duplicate();

      // Set up error handlers
      this.pubClient.on('error', (err) =>
        console.error('Redis Pub Client Error:', err),
      );
      this.subClient.on('error', (err) =>
        console.error('Redis Sub Client Error:', err),
      );

      // Connect both clients
      await this.pubClient.connect();
      await this.subClient.connect();

      console.log('✅ Redis Pub/Sub clients initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Redis Pub/Sub:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.pubClient) {
      await this.pubClient.quit();
    }
    if (this.subClient) {
      await this.subClient.quit();
    }
    console.log('✅ Redis Pub/Sub clients closed');
  }

  async publish(channel: string, message: any) {
    if (!this.pubClient) {
      console.error('Redis PubClient not initialized');
      return;
    }
    await this.pubClient.publish(channel, JSON.stringify(message));
  }

  async subscribe(channel: string, callback: (message: any) => void) {
    if (!this.subClient) {
      console.error('Redis SubClient not initialized');
      return;
    }

    await this.subClient.subscribe(channel, (message) => {
      try {
        const parsedMessage = JSON.parse(message);
        callback(parsedMessage);
      } catch (error) {
        console.error('Error parsing Redis message:', error);
      }
    });

    console.log(`✅ Subscribed to Redis channel: ${channel}`);
  }
}
