import { pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const rooms = pgTable('rooms', {
  id: varchar().primaryKey(),
  name: varchar().notNull(),
  createdBy: varchar('created_by_username', { length: 24 }).notNull(),
  createdByUserId: varchar('created_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  // Even if user logs in again, we know original creator
});

export type Room = typeof rooms.$inferSelect;
export type NewRoom = typeof rooms.$inferInsert;
