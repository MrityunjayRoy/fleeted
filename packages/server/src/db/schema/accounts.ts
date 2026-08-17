import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { chauffeurs } from './chauffeurs.js';
import { users } from './users.js';
import { vendors } from './vendors.js';

export const accounts = sqliteTable(
  'accounts',
  {
    id: text('id').primaryKey(),
    role: text('role').notNull(),
    name: text('name').notNull(),
    userId: text('user_id').references(() => users.id),
    vendorId: text('vendor_id').references(() => vendors.id),
    chauffeurId: text('chauffeur_id').references(() => chauffeurs.id),
  },
  (table) => [index('accounts_role_name_idx').on(table.role, table.name)],
);
