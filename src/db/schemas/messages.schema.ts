import { index, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

export const messages = pgTable(
  'messages',
  {
    id: varchar('id', { length: 32 })
      .primaryKey()
      .$defaultFn(() => `msg_${nanoid(12)}`),
    roomId: varchar('room_id', { length: 32 }).notNull(),
    username: varchar('username', { length: 24 }).notNull(),
    // content has at most 1000 characters, which is more than enough for a chat message
    content: text('content').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    roomIdx: index('room_idx').on(table.roomId),
    createdAtIdx: index('created_at_idx').on(table.createdAt),
  }),
);

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
