import { Inject, Injectable } from '@nestjs/common';
import {
  ForbiddenException,
  RoomNameTakenException,
  RoomNotFoundException,
} from '../common/exceptions/custom-exceptions';
import { UserService } from '../user/user.service';
import { RoomsRepository } from './rooms.repository';

@Injectable()
export class RoomsService {
  constructor(
    private roomsRepository: RoomsRepository,
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
        createdBy: room.createdBy, // This is the username
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

    // Check permission using username (createdBy stores username)
    if (room.createdBy !== username) {
      throw new ForbiddenException(
        'Only the room creator can delete this room',
      );
    }

    // Delete the room
    await this.roomsRepository.delete(id);

    // Delete room users from Redis
    await this.deleteRoomUsers(id);

    return { deleted: true };
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
