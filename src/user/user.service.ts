import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SessionService } from './session.service';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  constructor(
    private userRepository: UserRepository,
    private sessionService: SessionService,
  ) {}

  async login(username: string) {
    // Clean and validate username
    const cleanUsername = username.trim();

    // Find or create user
    let user = await this.userRepository.findByUsername(cleanUsername);

    if (!user) {
      user = await this.userRepository.create(cleanUsername);
    }

    // Create session token
    const sessionToken = await this.sessionService.createSession(
      user.id,
      user.username,
    );

    return {
      sessionToken,
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
      },
    };
  }

  async getUserFromSession(sessionToken: string) {
    if (!sessionToken) {
      return null;
    }

    const session = await this.sessionService.validateSession(sessionToken);

    if (!session) {
      return null;
    }

    // Get user from database
    const user = await this.userRepository.findById(session.userId);

    if (!user) {
      return null;
    }

    // Refresh session expiry
    await this.sessionService.refreshSession(sessionToken);

    return {
      id: user.id,
      username: user.username,
    };
  }

  async validateUser(sessionToken: string) {
    const user = await this.getUserFromSession(sessionToken);

    if (!user) {
      throw new UnauthorizedException('Invalid or expired session token');
    }

    return user;
  }

  async logout(sessionToken: string): Promise<void> {
    await this.sessionService.deleteSession(sessionToken);
  }

  async getUserById(id: string) {
    return await this.userRepository.findById(id);
  }

  async getUserByUsername(username: string) {
    return await this.userRepository.findByUsername(username);
  }
}
