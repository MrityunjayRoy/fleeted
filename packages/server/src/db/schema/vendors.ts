import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const vendors = sqliteTable('vendors', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  isCompany: integer('is_company', { mode: 'boolean' }).notNull().default(false),
});
