import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const notifications = sqliteTable(
  'notifications',
  {
    id: text('id').primaryKey(),
    recipientRole: text('recipient_role').notNull(),
    recipientId: text('recipient_id'),
    type: text('type').notNull(),
    message: text('message').notNull(),
    payload: text('payload').notNull(),
    read: integer('read', { mode: 'boolean' }).notNull().default(false),
    createdAt: text('created_at').notNull(),
  },
  (table) => [index('notifications_recipient_idx').on(table.recipientRole, table.recipientId)],
);
