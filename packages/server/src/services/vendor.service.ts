import type { IChauffeurRepository } from '../db/interfaces/chauffeur.repository.js';
import type { IVendorCarRepository } from '../db/interfaces/vendor-car.repository.js';
import type { VendorFleetDto } from '@fleeted/shared';
import { InsufficientVendorAccessError, NotFoundError } from '../domain/errors/index.js';

export interface VendorService {
  listFleet(vendorId: string): Promise<VendorFleetDto>;
  setCarAvailability(carId: string, vendorId: string, isAvailable: boolean): Promise<void>;
}

export class DefaultVendorService implements VendorService {
  constructor(
    private readonly vendorCars: IVendorCarRepository,
    private readonly chauffeurs: IChauffeurRepository,
  ) {}

  async listFleet(vendorId: string): Promise<VendorFleetDto> {
    const cars = await this.vendorCars.listByVendorId(vendorId);
    const chauffeurs = await this.chauffeurs.listByVendorId(vendorId);
    return {
      cars: cars.map((car) => ({
        id: car.id,
        vendorId: car.vendorId,
        modelId: car.modelId,
        plateNumber: car.plateNumber,
        isAvailable: car.isAvailable,
      })),
      chauffeurs: chauffeurs.map((chauffeur) => ({
        id: chauffeur.id,
        vendorId: chauffeur.vendorId,
        name: chauffeur.name,
        phone: chauffeur.phone,
        licenseNumber: chauffeur.licenseNumber,
        status: chauffeur.status,
      })),
    };
  }

  async setCarAvailability(carId: string, vendorId: string, isAvailable: boolean): Promise<void> {
    const car = await this.vendorCars.findById(carId);
    if (!car) throw new NotFoundError(`No vendor car with id "${carId}"`);
    if (car.vendorId !== vendorId) {
      throw new InsufficientVendorAccessError('This car belongs to another vendor');
    }
    if (car.isAvailable === isAvailable) return;
    await this.vendorCars.updateAvailability(carId, isAvailable);
  }
}
