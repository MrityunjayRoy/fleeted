import type { NewVendorCar, VendorCar } from '../../domain/entities/index.js';

export interface IVendorCarRepository {
  create(input: NewVendorCar & { id?: string }): Promise<VendorCar>;
  findById(id: string): Promise<VendorCar | null>;
  listByVendorId(vendorId: string): Promise<VendorCar[]>;
  findAvailableByModelId(modelId: string): Promise<VendorCar[]>;
  updateAvailability(id: string, isAvailable: boolean): Promise<VendorCar>;
}
