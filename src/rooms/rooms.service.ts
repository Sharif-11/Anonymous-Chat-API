import { Inject, Injectable } from '@nestjs/common';
import { ChatGateway } from '../chat/chat.gateway';
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
    private chatGateway: ChatGateway, // No forwardRef needed
  ) {}

  // Cache room existence in Redis when created
  async createRoom(name: string, username: string) {
    const existingRoom = await this.roomsRepository.findByName(name);
    if (existingRoom) {
      throw new RoomNameTakenException();
    }

    const user = await this.userService.getUserByUsername(username);
    if (!user) {
      throw new Error('User not found');
    }

    const room = await this.roomsRepository.create(name, username, user.id);

    // Cache room existence in Redis
    await this.redisClient.setEx(`room:${room.id}:exists`, 3600, 'true');

    return room;
  }

  async sendMessage(roomId: string, username: string, content: string) {
    const room = await this.roomsRepository.findById(roomId);
    if (!room) {
      throw new RoomNotFoundException(roomId);
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      throw new MessageEmptyException();
    }
    if (trimmedContent.length > 1000) {
      throw new MessageTooLongException();
    }

    const message = await this.messagesRepository.create(
      roomId,
      username,
      trimmedContent,
    );

    await this.chatGateway.broadcastNewMessage(roomId, message);

    return message;
  }

  async deleteRoom(id: string, username: string) {
    const room = await this.roomsRepository.findById(id);
    if (!room) {
      throw new RoomNotFoundException(id);
    }

    if (room.createdBy !== username) {
      throw new ForbiddenException(
        'Only the room creator can delete this room',
      );
    }
    console.log(`${username} is trying to delete room ${id}`);

    try {
      await this.chatGateway.broadcastRoomDeleted(id);
    } catch (error) {
      console.error(`Error broadcasting room deletion: ${error}`);
    }

    // // Small delay to ensure event is sent
    // await new Promise((resolve) => setTimeout(resolve, 100));

    await this.messagesRepository.deleteByRoomId(id);
    await this.roomsRepository.delete(id);
    await this.deleteRoomUsers(id);

    // // Remove from cache
    await this.redisClient.del(`room:${id}:exists`);
    console.log(`Room ${id} deleted and cache cleared`);

    return { deleted: true };
  }

  async getRoomById(id: string) {
    const room = await this.roomsRepository.findById(id);
    if (!room) {
      throw new RoomNotFoundException(id);
    }

    const activeUsers = await this.getRoomActiveUsersCount(id);

    return {
      id: room.id,
      name: room.name,
      createdBy: room.createdBy,
      createdAt: room.createdAt,
      activeUsers,
    };
  }

  async getAllRooms() {
    const rooms = await this.roomsRepository.findAll();

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

  async getMessages(roomId: string, limit: number = 50, before?: string) {
    const room = await this.roomsRepository.findById(roomId);
    if (!room) {
      throw new RoomNotFoundException(roomId);
    }

    const safeLimit = Math.min(limit, 100);
    const messages = await this.messagesRepository.findByRoomId(
      roomId,
      safeLimit,
      before,
    );

    const hasMore = messages.length === safeLimit;
    const nextCursor =
      hasMore && messages.length > 0 ? messages[messages.length - 1].id : null;

    return {
      messages,
      hasMore,
      nextCursor,
    };
  }

  private async getRoomActiveUsersCount(roomId: string): Promise<number> {
    try {
      return await this.redisClient.sCard(`room:${roomId}:users`);
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
