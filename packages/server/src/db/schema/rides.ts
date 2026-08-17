import { index, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { carModels } from './car-models.js';
import { users } from './users.js';

export const rides = sqliteTable(
  'rides',
  {
    id: text('id').primaryKey(),
    customerId: text('customer_id')
      .notNull()
      .references(() => users.id),
    modelId: text('model_id')
      .notNull()
      .references(() => carModels.id),
    pickup: text('pickup').notNull(),
    dropoff: text('dropoff').notNull(),
    pickupTime: text('pickup_time').notNull(),
    distanceKm: real('distance_km').notNull(),
    price: real('price').notNull(),
    status: text('status').notNull(),
    notes: text('notes'),
    createdAt: text('created_at').notNull(),
    confirmedAt: text('confirmed_at'),
    startedAt: text('started_at'),
    completedAt: text('completed_at'),
    cancelledAt: text('cancelled_at'),
  },
  (table) => [
    index('rides_status_idx').on(table.status),
    index('rides_customer_id_idx').on(table.customerId),
  ],
);
