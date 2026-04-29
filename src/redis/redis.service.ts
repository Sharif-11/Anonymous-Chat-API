import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_CLIENT') private redisClient: any) {}

  async get(key: string): Promise<string | null> {
    return await this.redisClient.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redisClient.setEx(key, ttl, value);
    } else {
      await this.redisClient.set(key, value);
    }
  }

  async setEx(key: string, ttl: number, value: string): Promise<void> {
    await this.redisClient.setEx(key, ttl, value);
  }

  async del(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  async expire(key: string, ttl: number): Promise<void> {
    await this.redisClient.expire(key, ttl);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redisClient.exists(key);
    return result === 1;
  }

  // Room active users methods
  async addUserToRoom(roomId: string, username: string): Promise<void> {
    await this.redisClient.sadd(`room:${roomId}:users`, username);
  }

  async removeUserFromRoom(roomId: string, username: string): Promise<void> {
    await this.redisClient.srem(`room:${roomId}:users`, username);
  }

  async getRoomActiveUsers(roomId: string): Promise<string[]> {
    return await this.redisClient.smembers(`room:${roomId}:users`);
  }

  async getRoomActiveUsersCount(roomId: string): Promise<number> {
    return await this.redisClient.scard(`room:${roomId}:users`);
  }

  async deleteRoomUsers(roomId: string): Promise<void> {
    await this.redisClient.del(`room:${roomId}:users`);
  }
}
