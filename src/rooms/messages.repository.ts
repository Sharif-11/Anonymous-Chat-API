import { Inject, Injectable } from '@nestjs/common';
import { desc, eq, lt } from 'drizzle-orm';
import { Message, messages } from '../db/schemas';

@Injectable()
export class MessagesRepository {
  constructor(@Inject('DRIZZLE') private db: any) {}

  async findByRoomId(
    roomId: string,
    limit: number = 50,
    before?: string,
  ): Promise<Message[]> {
    // Build base query
    let query = this.db
      .select()
      .from(messages)
      .where(eq(messages.roomId, roomId))
      .orderBy(desc(messages.createdAt))
      .limit(limit);

    // If 'before' cursor is provided, get messages older than that message
    if (before) {
      const beforeMessage = await this.findById(before);
      if (beforeMessage) {
        query = this.db
          .select()
          .from(messages)
          .where(
            this.db.and(
              eq(messages.roomId, roomId),
              lt(messages.createdAt, beforeMessage.createdAt),
            ),
          )
          .orderBy(desc(messages.createdAt))
          .limit(limit);
      }
    }

    return await query;
  }

  async findById(id: string): Promise<Message | undefined> {
    const result = await this.db
      .select()
      .from(messages)
      .where(eq(messages.id, id))
      .limit(1);

    return result[0];
  }

  async create(
    roomId: string,
    username: string,
    content: string,
  ): Promise<Message> {
    const result = await this.db
      .insert(messages)
      .values({
        roomId,
        username,
        content: content.trim(),
        createdAt: new Date(),
      })
      .returning();

    return result[0];
  }

  async deleteByRoomId(roomId: string): Promise<void> {
    await this.db.delete(messages).where(eq(messages.roomId, roomId));
  }
}
