import { Inject, Injectable, forwardRef } from '@nestjs/common';
import {
  MessageEmptyException,
  MessageTooLongException,
  RoomNotFoundException,
} from '../common/exceptions/custom-exceptions';
import { MessagesRepository } from '../rooms/messages.repository';
import { RoomsService } from '../rooms/rooms.service';

@Injectable()
export class MessagesService {
  constructor(
    private messagesRepository: MessagesRepository,
    @Inject(forwardRef(() => RoomsService))
    private roomsService: RoomsService, // Use forwardRef to break circular dependency
  ) {}

  async sendMessage(roomId: string, username: string, content: string) {
    // Verify room exists
    try {
      await this.roomsService.getRoomById(roomId);
    } catch (error) {
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
    try {
      await this.roomsService.getRoomById(roomId);
    } catch (error) {
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

  async deleteRoomMessages(roomId: string) {
    await this.messagesRepository.deleteByRoomId(roomId);
  }
}
