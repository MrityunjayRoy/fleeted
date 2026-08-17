import type { NewUser, User } from '../../domain/entities/index.js';

export interface IUserRepository {
  create(input: NewUser & { id?: string }): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByName(name: string): Promise<User | null>;
}
