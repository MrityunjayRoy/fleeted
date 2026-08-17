import { randomUUID } from 'node:crypto';

import { eq } from 'drizzle-orm';

import type { CarModel, NewCarModel } from '../../domain/entities/index.js';
import type { Db } from '../client.js';
import { carModels } from '../schema/index.js';
import type { ICarModelRepository } from '../interfaces/car-model.repository.js';
import { toCarModel } from './mappers.js';

export class DrizzleCarModelRepository implements ICarModelRepository {
  constructor(private readonly db: Db) {}

  async create(input: NewCarModel): Promise<CarModel> {
    const row: CarModel = { id: randomUUID(), ...input };
    await this.db.insert(carModels).values(row);
    return row;
  }

  async findById(id: string): Promise<CarModel | null> {
    const rows = await this.db.select().from(carModels).where(eq(carModels.id, id)).limit(1);
    const row = rows[0];
    return row ? toCarModel(row) : null;
  }

  async findAll(): Promise<CarModel[]> {
    const rows = await this.db.select().from(carModels);
    return rows.map(toCarModel);
  }
}
