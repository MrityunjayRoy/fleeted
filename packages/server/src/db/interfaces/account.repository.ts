import type { Role } from '@fleeted/shared';

import type { Account, NewAccount } from '../../domain/entities/index.js';

export interface IAccountRepository {
  create(input: NewAccount & { id?: string }): Promise<Account>;
  findById(id: string): Promise<Account | null>;
  findByRoleAndName(role: Role, name: string): Promise<Account | null>;
}
