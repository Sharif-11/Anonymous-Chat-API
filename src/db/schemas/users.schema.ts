import { pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

export const users = pgTable('users', {
  id: varchar('id', { length: 16 })
    .primaryKey()
    .$defaultFn(() => `usr_${nanoid(12)}`),
  username: varchar('username', { length: 24 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
