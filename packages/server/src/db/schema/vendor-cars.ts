import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { carModels } from './car-models.js';
import { vendors } from './vendors.js';

export const vendorCars = sqliteTable(
  'vendor_cars',
  {
    id: text('id').primaryKey(),
    vendorId: text('vendor_id')
      .notNull()
      .references(() => vendors.id),
    modelId: text('model_id')
      .notNull()
      .references(() => carModels.id),
    plateNumber: text('plate_number').notNull(),
    isAvailable: integer('is_available', { mode: 'boolean' }).notNull().default(true),
  },
  (table) => [index('vendor_cars_vendor_id_idx').on(table.vendorId)],
);
