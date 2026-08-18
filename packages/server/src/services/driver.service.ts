import type { IChauffeurRepository } from '../db/interfaces/chauffeur.repository.js';
import type { IRideOfferRepository } from '../db/interfaces/ride-offer.repository.js';
import type { IRideRepository } from '../db/interfaces/ride.repository.js';
import type { IVendorCarRepository } from '../db/interfaces/vendor-car.repository.js';
import type { Ride } from '../domain/entities/index.js';
import type { EventBus } from '../domain/events.js';
import { ForbiddenError, NotFoundError, RideStateTransitionError } from '../domain/errors/index.js';

export interface DriverService {
  start(rideId: string, chauffeurId: string): Promise<Ride>;
  complete(rideId: string, chauffeurId: string): Promise<Ride>;
}

export class DefaultDriverService implements DriverService {
  constructor(
    private readonly rides: IRideRepository,
    private readonly rideOffers: IRideOfferRepository,
    private readonly vendorCars: IVendorCarRepository,
    private readonly chauffeurs: IChauffeurRepository,
    private readonly eventBus: EventBus,
  ) {}

  async start(rideId: string, chauffeurId: string): Promise<Ride> {
    const assignment = await this.findAssignment(rideId, chauffeurId);
    if (assignment.ride.status !== 'CONFIRMED') {
      throw new RideStateTransitionError(
        `Cannot start a ride in status ${assignment.ride.status}, expected CONFIRMED`,
      );
    }
    const started = await this.rides.start(rideId, new Date().toISOString());
    this.eventBus.emit({ type: 'ride:started', rideId, chauffeurId });
    return started;
  }

  async complete(rideId: string, chauffeurId: string): Promise<Ride> {
    const assignment = await this.findAssignment(rideId, chauffeurId);
    if (assignment.ride.status !== 'STARTED') {
      throw new RideStateTransitionError(
        `Cannot complete a ride in status ${assignment.ride.status}, expected STARTED`,
      );
    }
    const at = new Date().toISOString();
    if (assignment.offer.vendorCarId !== undefined) {
      await this.vendorCars.updateAvailability(assignment.offer.vendorCarId, true);
    }
    await this.chauffeurs.updateStatus(chauffeurId, 'AVAILABLE');
    const completed = await this.rides.complete(rideId, at);
    this.eventBus.emit({ type: 'ride:completed', rideId, chauffeurId });
    return completed;
  }

  private async findAssignment(
    rideId: string,
    chauffeurId: string,
  ): Promise<{ ride: Ride; offer: { vendorCarId?: string } }> {
    const ride = await this.rides.findById(rideId);
    if (!ride) throw new NotFoundError(`No ride with id "${rideId}"`);

    const offers = await this.rideOffers.listByRideId(rideId);
    const accepted = offers.find((offer) => offer.status === 'ACCEPTED');
    if (!accepted || accepted.chauffeurId !== chauffeurId) {
      throw new ForbiddenError('This ride is not assigned to you');
    }
    return { ride, offer: accepted };
  }
}
