import type { AuthResponse, LoginRequest, MeResponse } from '@fleeted/shared';

import type { IAccountRepository } from '../db/interfaces/account.repository.js';
import { UnauthorizedError } from '../domain/errors.js';
import type { Account } from '../domain/entities/index.js';
import { signToken } from '../middleware/auth.js';

export interface AuthService {
  login(input: LoginRequest): Promise<AuthResponse>;
  me(accountId: string): Promise<MeResponse>;
}

export class DefaultAuthService implements AuthService {
  constructor(
    private readonly accounts: IAccountRepository,
    private readonly jwtSecret: string,
    private readonly jwtExpiresIn: string,
  ) {}

  async login(input: LoginRequest): Promise<AuthResponse> {
    const account = await this.accounts.findByRoleAndName(input.role, input.name);
    if (!account) {
      throw new UnauthorizedError(`No ${input.role} account named "${input.name}"`);
    }
    return {
      token: signToken(this.jwtSecret, this.jwtExpiresIn, account),
      role: account.role,
      userId: account.id,
      displayName: account.name,
    };
  }

  async me(accountId: string): Promise<MeResponse> {
    const account = await this.accounts.findById(accountId);
    if (!account) {
      throw new UnauthorizedError('Account no longer exists');
    }
    return toMeResponse(account);
  }
}

function toMeResponse(account: Account): MeResponse {
  return {
    role: account.role,
    userId: account.id,
    displayName: account.name,
  };
}
