import { pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { nanoid } from 'nanoid';

export const rooms = pgTable('rooms', {
  // auto generate ID with nanoid, prefixed with "room_"
  id: varchar('id', { length: 16 })
    .primaryKey()
    .$defaultFn(() => `room_${nanoid(12)}`),
  name: varchar('name', { length: 32 }).notNull().unique(),
  createdBy: varchar('created_by_username', { length: 24 }).notNull(),
  createdByUserId: varchar('created_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  // Even if user logs in again, we know original creator
});

export type Room = typeof rooms.$inferSelect;
export type NewRoom = typeof rooms.$inferInsert;
