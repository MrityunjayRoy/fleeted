import type { RideStatus } from '@fleeted/shared';

import type { NewRide, Ride, RideWithParticipants } from '../../domain/entities/index.js';

export interface IRideRepository {
  create(input: NewRide & { id?: string }): Promise<Ride>;
  findById(id: string): Promise<Ride | null>;
  findWithParticipants(id: string): Promise<RideWithParticipants | null>;
  listByCustomerId(customerId: string): Promise<Ride[]>;
  listByChauffeurId(chauffeurId: string): Promise<Ride[]>;
  listByVendorId(vendorId: string): Promise<Ride[]>;
  listAll(status?: RideStatus): Promise<Ride[]>;
  moveToMatching(id: string): Promise<Ride>;
  confirm(id: string, at: string): Promise<Ride>;
  start(id: string, at: string): Promise<Ride>;
  complete(id: string, at: string): Promise<Ride>;
  cancel(id: string, at: string): Promise<Ride>;
}
