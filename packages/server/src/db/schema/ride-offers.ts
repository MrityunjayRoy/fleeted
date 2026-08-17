import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { chauffeurs } from './chauffeurs.js';
import { rides } from './rides.js';
import { vendorCars } from './vendor-cars.js';
import { vendors } from './vendors.js';

export const rideOffers = sqliteTable(
  'ride_offers',
  {
    id: text('id').primaryKey(),
    rideId: text('ride_id')
      .notNull()
      .references(() => rides.id),
    vendorId: text('vendor_id')
      .notNull()
      .references(() => vendors.id),
    vendorCarId: text('vendor_car_id').references(() => vendorCars.id),
    chauffeurId: text('chauffeur_id').references(() => chauffeurs.id),
    status: text('status').notNull(),
    createdAt: text('created_at').notNull(),
    acceptedAt: text('accepted_at'),
    rejectedAt: text('rejected_at'),
    releasedAt: text('released_at'),
  },
  (table) => [
    index('ride_offers_ride_id_idx').on(table.rideId),
    index('ride_offers_vendor_id_idx').on(table.vendorId),
    index('ride_offers_chauffeur_id_idx').on(table.chauffeurId),
  ],
);
