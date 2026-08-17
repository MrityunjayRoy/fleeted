import { randomUUID } from 'node:crypto';

import { and, eq } from 'drizzle-orm';
import type { Role } from '@fleeted/shared';

import type { Account, NewAccount } from '../../domain/entities/index.js';
import type { Db } from '../client.js';
import { accounts } from '../schema/index.js';
import type { IAccountRepository } from '../interfaces/account.repository.js';
import { toAccount } from './mappers.js';

export class DrizzleAccountRepository implements IAccountRepository {
  constructor(private readonly db: Db) {}

  async create(input: NewAccount & { id?: string }): Promise<Account> {
    const row: Account = { ...input, id: input.id ?? randomUUID() };
    await this.db.insert(accounts).values(row);
    return row;
  }

  async findById(id: string): Promise<Account | null> {
    const rows = await this.db.select().from(accounts).where(eq(accounts.id, id)).limit(1);
    const row = rows[0];
    return row ? toAccount(row) : null;
  }

  async findByRoleAndName(role: Role, name: string): Promise<Account | null> {
    const rows = await this.db
      .select()
      .from(accounts)
      .where(and(eq(accounts.role, role), eq(accounts.name, name)))
      .limit(1);
    const row = rows[0];
    return row ? toAccount(row) : null;
  }
}
