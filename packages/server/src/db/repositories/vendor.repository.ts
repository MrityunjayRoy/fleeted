import { randomUUID } from 'node:crypto';

import { eq, inArray } from 'drizzle-orm';

import type { NewVendor, Vendor } from '../../domain/entities/index.js';
import type { Db } from '../client.js';
import { vendors } from '../schema/index.js';
import type { IVendorRepository } from '../interfaces/vendor.repository.js';
import { toVendor } from './mappers.js';

export class DrizzleVendorRepository implements IVendorRepository {
  constructor(private readonly db: Db) {}

  async create(input: NewVendor): Promise<Vendor> {
    const row: Vendor = { id: randomUUID(), ...input };
    await this.db.insert(vendors).values(row);
    return row;
  }

  async findById(id: string): Promise<Vendor | null> {
    const rows = await this.db.select().from(vendors).where(eq(vendors.id, id)).limit(1);
    const row = rows[0];
    return row ? toVendor(row) : null;
  }

  async findByIds(ids: string[]): Promise<Vendor[]> {
    if (ids.length === 0) return [];
    const rows = await this.db.select().from(vendors).where(inArray(vendors.id, ids));
    return rows.map(toVendor);
  }

  async findAll(): Promise<Vendor[]> {
    const rows = await this.db.select().from(vendors);
    return rows.map(toVendor);
  }
}
