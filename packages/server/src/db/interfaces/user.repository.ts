import type { NewUser, User } from '../../domain/entities/index.js';

export interface IUserRepository {
  create(input: NewUser): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByName(name: string): Promise<User | null>;
}
