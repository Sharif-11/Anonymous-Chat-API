import { Inject, Injectable } from '@nestjs/common';
import {
  ForbiddenException,
  MessageEmptyException,
  MessageTooLongException,
  RoomNameTakenException,
  RoomNotFoundException,
} from '../common/exceptions/custom-exceptions';
import { UserService } from '../user/user.service';
import { MessagesRepository } from './messages.repository';
import { RoomsRepository } from './rooms.repository';

@Injectable()
export class RoomsService {
  constructor(
    private roomsRepository: RoomsRepository,
    private messagesRepository: MessagesRepository,
    private userService: UserService,
    @Inject('REDIS_CLIENT') private redisClient: any,
  ) {}

  async createRoom(name: string, username: string) {
    // Check if room name exists
    const existingRoom = await this.roomsRepository.findByName(name);
    if (existingRoom) {
      throw new RoomNameTakenException();
    }

    // Get user to get the user ID
    const user = await this.userService.getUserByUsername(username);
    if (!user) {
      throw new Error('User not found');
    }

    // Create room with both username and user ID
    const room = await this.roomsRepository.create(name, username, user.id);

    return room;
  }

  async getAllRooms() {
    const rooms = await this.roomsRepository.findAll();

    // Add active users count from Redis
    const roomsWithActiveUsers = await Promise.all(
      rooms.map(async (room) => ({
        id: room.id,
        name: room.name,
        createdBy: room.createdBy,
        createdAt: room.createdAt,
        activeUsers: await this.getRoomActiveUsersCount(room.id),
      })),
    );

    return roomsWithActiveUsers;
  }

  async getRoomById(id: string) {
    const room = await this.roomsRepository.findById(id);
    if (!room) {
      throw new RoomNotFoundException(id);
    }

    // Get active users count from Redis
    const activeUsers = await this.getRoomActiveUsersCount(id);

    return {
      id: room.id,
      name: room.name,
      createdBy: room.createdBy,
      createdAt: room.createdAt,
      activeUsers,
    };
  }

  async deleteRoom(id: string, username: string) {
    const room = await this.roomsRepository.findById(id);
    if (!room) {
      throw new RoomNotFoundException(id);
    }

    // Check permission using username
    if (room.createdBy !== username) {
      throw new ForbiddenException(
        'Only the room creator can delete this room',
      );
    }

    // Delete all messages in the room
    await this.messagesRepository.deleteByRoomId(id);

    // Delete the room
    await this.roomsRepository.delete(id);

    // Delete room users from Redis
    await this.deleteRoomUsers(id);

    return { deleted: true };
  }

  // Message methods
  async sendMessage(roomId: string, username: string, content: string) {
    // Verify room exists
    const room = await this.roomsRepository.findById(roomId);
    if (!room) {
      throw new RoomNotFoundException(roomId);
    }

    // Validate content
    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      throw new MessageEmptyException();
    }
    if (trimmedContent.length > 1000) {
      throw new MessageTooLongException();
    }

    // Save message
    const message = await this.messagesRepository.create(
      roomId,
      username,
      trimmedContent,
    );

    return message;
  }

  async getMessages(roomId: string, limit: number = 50, before?: string) {
    // Verify room exists
    const room = await this.roomsRepository.findById(roomId);
    if (!room) {
      throw new RoomNotFoundException(roomId);
    }

    // Ensure limit doesn't exceed 100
    const safeLimit = Math.min(limit, 100);

    // Get messages from repository
    const messages = await this.messagesRepository.findByRoomId(
      roomId,
      safeLimit,
      before,
    );

    // Determine if there are more messages
    const hasMore = messages.length === safeLimit;

    // Set next cursor (last message ID if there are more)
    const nextCursor =
      hasMore && messages.length > 0 ? messages[messages.length - 1].id : null;

    return {
      messages,
      hasMore,
      nextCursor,
    };
  }

  // Redis helper methods
  private async getRoomActiveUsersCount(roomId: string): Promise<number> {
    try {
      return await this.redisClient.scard(`room:${roomId}:users`);
    } catch (error) {
      return 0;
    }
  }

  private async deleteRoomUsers(roomId: string): Promise<void> {
    try {
      await this.redisClient.del(`room:${roomId}:users`);
    } catch (error) {
      console.error(`Error deleting room users from Redis: ${error}`);
    }
  }
}
