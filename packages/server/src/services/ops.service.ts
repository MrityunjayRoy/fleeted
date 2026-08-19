import type { RideStatus } from '@fleeted/shared';

import type { IRideOfferRepository } from '../db/interfaces/ride-offer.repository.js';
import type { IRideRepository } from '../db/interfaces/ride.repository.js';
import type { IChauffeurRepository } from '../db/interfaces/chauffeur.repository.js';
import type { IVendorCarRepository } from '../db/interfaces/vendor-car.repository.js';
import type { TransactionRunner } from '../config/container.js';
import type { Ride, RideWithParticipants } from '../domain/entities/index.js';
import type { EventBus } from '../domain/events.js';
import { NotFoundError, RideStateTransitionError } from '../domain/errors/index.js';

export interface OpsService {
  approveOffer(offerId: string): Promise<Ride>;
  listRides(filter?: RideStatus): Promise<RideWithParticipants[]>;
  getRideDetail(id: string): Promise<RideWithParticipants>;
}

export class DefaultOpsService implements OpsService {
  constructor(
    private readonly rides: IRideRepository,
    private readonly rideOffers: IRideOfferRepository,
    private readonly vendorCars: IVendorCarRepository,
    private readonly chauffeurs: IChauffeurRepository,
    private readonly eventBus: EventBus,
    private readonly withTransaction: TransactionRunner,
  ) {}

  async approveOffer(offerId: string): Promise<Ride> {
    const offer = await this.rideOffers.findById(offerId);
    if (!offer) throw new NotFoundError(`No offer with id "${offerId}"`);

    const approved = await this.withTransaction(async (tx) => {
      const freshOffer = await tx.rideOffers.findById(offerId);
      if (!freshOffer) throw new NotFoundError(`No offer with id "${offerId}"`);
      if (freshOffer.status !== 'ACCEPTED') {
        throw new RideStateTransitionError(
          `Only ACCEPTED offers can be approved, offer is ${freshOffer.status}`,
        );
      }

      const ride = await tx.rides.findById(freshOffer.rideId);
      if (!ride) throw new NotFoundError(`No ride with id "${freshOffer.rideId}"`);
      if (ride.status !== 'MATCHING') {
        throw new RideStateTransitionError(
          `Ride is already ${ride.status}, it cannot be approved again`,
        );
      }

      const at = new Date().toISOString();
      const otherOffers = await tx.rideOffers.listByRideId(ride.id);
      for (const other of otherOffers) {
        if (other.id === offerId || other.status === 'REJECTED' || other.status === 'RELEASED') {
          continue;
        }
        if (other.status === 'ACCEPTED') {
          if (other.vendorCarId !== undefined) {
            await tx.vendorCars.updateAvailability(other.vendorCarId, true);
          }
          if (other.chauffeurId !== undefined) {
            await tx.chauffeurs.updateStatus(other.chauffeurId, 'AVAILABLE');
          }
        }
        await tx.rideOffers.reject(other.id, at);
      }

      return tx.rides.confirm(ride.id, at);
    });

    if (offer.chauffeurId === undefined) {
      throw new RideStateTransitionError('Accepted offer has no assigned chauffeur');
    }
    this.eventBus.emit({
      type: 'ride:confirmed',
      rideId: approved.id,
      vendorId: offer.vendorId,
      chauffeurId: offer.chauffeurId,
    });
    return approved;
  }

  async listRides(filter?: RideStatus): Promise<RideWithParticipants[]> {
    const rides = await this.rides.listAll(filter);
    const detailed = await Promise.all(
      rides.map((ride) => this.rides.findWithParticipants(ride.id)),
    );
    return detailed.filter((item): item is RideWithParticipants => item !== null);
  }

  async getRideDetail(id: string): Promise<RideWithParticipants> {
    const detail = await this.rides.findWithParticipants(id);
    if (!detail) throw new NotFoundError(`No ride with id "${id}"`);
    return detail;
  }
}
