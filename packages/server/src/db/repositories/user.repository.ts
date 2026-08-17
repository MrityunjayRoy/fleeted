import { randomUUID } from 'node:crypto';

import { eq } from 'drizzle-orm';

import type { NewUser, User } from '../../domain/entities/index.js';
import type { Db } from '../client.js';
import { users } from '../schema/index.js';
import type { IUserRepository } from '../interfaces/user.repository.js';
import { toUser } from './mappers.js';

export class DrizzleUserRepository implements IUserRepository {
  constructor(private readonly db: Db) {}

  async create(input: NewUser): Promise<User> {
    const row: User = { id: randomUUID(), ...input };
    await this.db.insert(users).values(row);
    return row;
  }

  async findById(id: string): Promise<User | null> {
    const rows = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    const row = rows[0];
    return row ? toUser(row) : null;
  }

  async findByName(name: string): Promise<User | null> {
    const rows = await this.db.select().from(users).where(eq(users.name, name)).limit(1);
    const row = rows[0];
    return row ? toUser(row) : null;
  }
}
