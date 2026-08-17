import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { vendors } from './vendors.js';

export const chauffeurs = sqliteTable(
  'chauffeurs',
  {
    id: text('id').primaryKey(),
    vendorId: text('vendor_id')
      .notNull()
      .references(() => vendors.id),
    name: text('name').notNull(),
    phone: text('phone').notNull(),
    licenseNumber: text('license_number').notNull(),
    status: text('status').notNull().default('AVAILABLE'),
  },
  (table) => [index('chauffeurs_vendor_id_idx').on(table.vendorId)],
);
