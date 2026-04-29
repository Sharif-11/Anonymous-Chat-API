import { Inject, Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { Room, rooms } from '../db/schemas';

@Injectable()
export class RoomsRepository {
  constructor(@Inject('DRIZZLE') private db: any) {}

  async findAll(): Promise<Room[]> {
    return await this.db.select().from(rooms).orderBy(desc(rooms.createdAt));
  }

  async findById(id: string): Promise<Room | undefined> {
    const result = await this.db
      .select()
      .from(rooms)
      .where(eq(rooms.id, id))
      .limit(1);

    return result[0];
  }

  async findByName(name: string): Promise<Room | undefined> {
    const result = await this.db
      .select()
      .from(rooms)
      .where(eq(rooms.name, name))
      .limit(1);

    return result[0];
  }

  async create(
    name: string,
    createdByUsername: string,
    createdByUserId: string,
  ): Promise<Room> {
    // Let the schema auto-generate the ID
    const result = await this.db
      .insert(rooms)
      .values({
        name,
        createdBy: createdByUsername, // created_by_username
        createdByUserId, // created_by_user_id (foreign key to users table)
        createdAt: new Date(),
      })
      .returning();

    return result[0];
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(rooms).where(eq(rooms.id, id));
  }
}
