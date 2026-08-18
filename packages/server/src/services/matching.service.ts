import type { IChauffeurRepository } from '../db/interfaces/chauffeur.repository.js';
import type { IRideOfferRepository } from '../db/interfaces/ride-offer.repository.js';
import type { IRideRepository } from '../db/interfaces/ride.repository.js';
import type { IVendorCarRepository } from '../db/interfaces/vendor-car.repository.js';
import type { EventBus } from '../domain/events.js';
import type { Ride } from '../domain/entities/index.js';

export interface MatchingResult {
  ride: Ride;
  matchedVendorIds: string[];
}

export interface MatchingService {
  match(ride: Ride): Promise<MatchingResult>;
}

export class DefaultMatchingService implements MatchingService {
  constructor(
    private readonly vendorCars: IVendorCarRepository,
    private readonly chauffeurs: IChauffeurRepository,
    private readonly rideOffers: IRideOfferRepository,
    private readonly rides: IRideRepository,
    private readonly eventBus: EventBus,
  ) {}

  async match(ride: Ride): Promise<MatchingResult> {
    const cars = await this.vendorCars.findAvailableByModelId(ride.modelId);
    const vendorIds = [...new Set(cars.map((car) => car.vendorId))];
    const availableChauffeurs = await this.chauffeurs.findAvailableByVendorIds(vendorIds);
    const chauffeurVendorIds = new Set(availableChauffeurs.map((chauffeur) => chauffeur.vendorId));
    const matchedVendorIds = vendorIds.filter((vendorId) => chauffeurVendorIds.has(vendorId));

    if (matchedVendorIds.length > 0) {
      const at = new Date().toISOString();
      for (const vendorId of matchedVendorIds) {
        await this.rideOffers.create({
          rideId: ride.id,
          vendorId,
          status: 'PENDING',
          createdAt: at,
        });
      }
      await this.rides.moveToMatching(ride.id);
      const fresh = (await this.rides.findById(ride.id)) ?? ride;
      this.eventBus.emit({ type: 'ride:created', ride: fresh, matchedVendorIds });
      return { ride: fresh, matchedVendorIds };
    }

    return { ride, matchedVendorIds };
  }
}
