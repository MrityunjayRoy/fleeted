import type { OfferStatus } from '@fleeted/shared';

import type { Chauffeur } from './chauffeur.js';
import type { VendorCar } from './vendor-car.js';
import type { Vendor } from './vendor.js';

export interface RideOffer {
  id: string;
  rideId: string;
  vendorId: string;
  vendorCarId?: string;
  chauffeurId?: string;
  status: OfferStatus;
  createdAt: string;
  acceptedAt?: string;
  rejectedAt?: string;
  releasedAt?: string;
}

export type NewRideOffer = Omit<RideOffer, 'id'>;

export interface RideOfferWithDetails {
  offer: RideOffer;
  vendor: Vendor;
  vendorCar: VendorCar | null;
  chauffeur: Chauffeur | null;
}
