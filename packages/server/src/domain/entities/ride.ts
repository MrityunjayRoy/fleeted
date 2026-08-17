import type { RideStatus } from '@fleeted/shared';

import type { CarModel } from './car-model.js';
import type { User } from './user.js';
import type { RideOfferWithDetails } from './ride-offer.js';

export interface Ride {
  id: string;
  customerId: string;
  modelId: string;
  pickup: string;
  dropoff: string;
  pickupTime: string;
  distanceKm: number;
  price: number;
  status: RideStatus;
  notes?: string;
  createdAt: string;
  confirmedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
}

export type NewRide = Omit<Ride, 'id'>;

export interface RideWithParticipants {
  ride: Ride;
  model: CarModel;
  customer: User;
  offers: RideOfferWithDetails[];
}
