import type { NewVendor, Vendor } from '../../domain/entities/index.js';

export interface IVendorRepository {
  create(input: NewVendor & { id?: string }): Promise<Vendor>;
  findById(id: string): Promise<Vendor | null>;
  findByIds(ids: string[]): Promise<Vendor[]>;
  findAll(): Promise<Vendor[]>;
}
