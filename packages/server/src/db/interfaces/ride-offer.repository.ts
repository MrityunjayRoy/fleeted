import type { NewRideOffer, RideOffer, RideOfferWithDetails } from '../../domain/entities/index.js';

export interface IRideOfferRepository {
  create(input: NewRideOffer): Promise<RideOffer>;
  findById(id: string): Promise<RideOffer | null>;
  findWithDetails(id: string): Promise<RideOfferWithDetails | null>;
  listByRideId(rideId: string): Promise<RideOffer[]>;
  listByRideIdWithDetails(rideId: string): Promise<RideOfferWithDetails[]>;
  listByVendorId(vendorId: string): Promise<RideOffer[]>;
  accept(id: string, vendorCarId: string, chauffeurId: string, at: string): Promise<RideOffer>;
  reject(id: string, at: string): Promise<RideOffer>;
  release(id: string, at: string): Promise<RideOffer>;
}
