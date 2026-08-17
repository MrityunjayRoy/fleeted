import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const carModels = sqliteTable('car_models', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  basePrice: integer('base_price').notNull(),
  pricePerKm: real('price_per_km').notNull(),
  capacity: integer('capacity').notNull(),
  description: text('description').notNull(),
});
