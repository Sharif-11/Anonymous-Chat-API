import { Inject, Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';

@Injectable()
export class SessionService {
  constructor(@Inject('REDIS_CLIENT') private redisClient: any) {}

  async createSession(userId: string, username: string): Promise<string> {
    const sessionToken = this.generateSessionToken();
    const sessionData = {
      userId,
      username,
      createdAt: new Date().toISOString(),
    };

    // Store in Redis with 24 hour expiry (86400 seconds)
    await this.redisClient.setEx(
      `session:${sessionToken}`,
      86400,
      JSON.stringify(sessionData),
    );

    return sessionToken;
  }

  async validateSession(
    sessionToken: string,
  ): Promise<{ userId: string; username: string } | null> {
    const data = await this.redisClient.get(`session:${sessionToken}`);

    if (!data) {
      return null;
    }

    return JSON.parse(data);
  }

  async deleteSession(sessionToken: string): Promise<void> {
    await this.redisClient.del(`session:${sessionToken}`);
  }

  async refreshSession(sessionToken: string): Promise<void> {
    // Refresh expiry to 24 hours
    await this.redisClient.expire(`session:${sessionToken}`, 86400);
  }

  private generateSessionToken(): string {
    // Generate opaque token like: sess_8f9a2b3c4d5e6f7g8h9i0j
    const random = randomBytes(32).toString('hex');
    return `sess_${random}`;
  }
}
