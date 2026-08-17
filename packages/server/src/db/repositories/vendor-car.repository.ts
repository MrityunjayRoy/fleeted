import { randomUUID } from 'node:crypto';

import { and, eq } from 'drizzle-orm';

import type { NewVendorCar, VendorCar } from '../../domain/entities/index.js';
import type { Db } from '../client.js';
import { vendorCars } from '../schema/index.js';
import type { IVendorCarRepository } from '../interfaces/vendor-car.repository.js';
import { toVendorCar } from './mappers.js';

export class DrizzleVendorCarRepository implements IVendorCarRepository {
  constructor(private readonly db: Db) {}

  async create(input: NewVendorCar): Promise<VendorCar> {
    const row: VendorCar = { id: randomUUID(), ...input };
    await this.db.insert(vendorCars).values(row);
    return row;
  }

  async findById(id: string): Promise<VendorCar | null> {
    const rows = await this.db.select().from(vendorCars).where(eq(vendorCars.id, id)).limit(1);
    const row = rows[0];
    return row ? toVendorCar(row) : null;
  }

  async findAvailableByModelId(modelId: string): Promise<VendorCar[]> {
    const rows = await this.db
      .select()
      .from(vendorCars)
      .where(and(eq(vendorCars.modelId, modelId), eq(vendorCars.isAvailable, true)));
    return rows.map(toVendorCar);
  }

  async updateAvailability(id: string, isAvailable: boolean): Promise<VendorCar> {
    const rows = await this.db
      .update(vendorCars)
      .set({ isAvailable })
      .where(eq(vendorCars.id, id))
      .returning();
    const row = rows[0];
    if (!row) throw new Error(`vendor car not found: ${id}`);
    return toVendorCar(row);
  }
}
