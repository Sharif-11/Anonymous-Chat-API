import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { User, users } from '../db/schemas';

@Injectable()
export class UserRepository {
  constructor(@Inject('DRIZZLE') private db: any) {}

  async findByUsername(username: string): Promise<User | undefined> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    return result[0];
  }

  async findById(id: string): Promise<User | undefined> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return result[0];
  }

  async create(username: string): Promise<User> {
    // Don't provide id - schema will auto-generate it with nanoid
    const newUser = {
      username,
      createdAt: new Date(),
    };

    const result = await this.db.insert(users).values(newUser).returning();

    return result[0];
  }
}
