import type { ICarModelRepository } from '../db/interfaces/car-model.repository.js';
import type { IChauffeurRepository } from '../db/interfaces/chauffeur.repository.js';
import type { IRideOfferRepository } from '../db/interfaces/ride-offer.repository.js';
import type { IRideRepository } from '../db/interfaces/ride.repository.js';
import type { IVendorCarRepository } from '../db/interfaces/vendor-car.repository.js';
import type { TransactionRunner } from '../config/container.js';
import type { Actor, Ride, RideWithParticipants } from '../domain/entities/index.js';
import type { EventBus } from '../domain/events.js';
import {
  ForbiddenError,
  NotFoundError,
  RideStateTransitionError,
  ValidationError,
} from '../domain/errors/index.js';
import type { MatchingService } from './matching.service.js';

export interface CreateRideInput {
  modelId: string;
  pickup: string;
  dropoff: string;
  pickupTime: string;
  distanceKm: number;
  notes?: string;
}

export interface CreateRideResult {
  ride: Ride;
  matchedVendorIds: string[];
}

export interface RideService {
  create(input: CreateRideInput, customerId: string): Promise<CreateRideResult>;
  getById(id: string, actor: Actor): Promise<RideWithParticipants | null>;
  cancelByCustomer(rideId: string, customerId: string): Promise<Ride>;
  cancelByOps(rideId: string): Promise<Ride>;
  getMine(actor: Actor): Promise<RideWithParticipants[]>;
}

const CANCELLABLE_STATUSES = ['PENDING', 'MATCHING', 'CONFIRMED'] as const;

export class DefaultRideService implements RideService {
  constructor(
    private readonly rides: IRideRepository,
    private readonly rideOffers: IRideOfferRepository,
    private readonly vendorCars: IVendorCarRepository,
    private readonly chauffeurs: IChauffeurRepository,
    private readonly carModels: ICarModelRepository,
    private readonly matching: MatchingService,
    private readonly eventBus: EventBus,
    private readonly withTransaction: TransactionRunner,
  ) {}

  async create(input: CreateRideInput, customerId: string): Promise<CreateRideResult> {
    const model = await this.carModels.findById(input.modelId);
    if (!model) throw new NotFoundError(`No car model with id "${input.modelId}"`);

    if (new Date(input.pickupTime).getTime() <= Date.now()) {
      throw new ValidationError('pickupTime must be in the future');
    }

    const price = Math.round(model.basePrice + input.distanceKm * model.pricePerKm);
    const ride = await this.rides.create({
      customerId,
      modelId: model.id,
      pickup: input.pickup,
      dropoff: input.dropoff,
      pickupTime: input.pickupTime,
      distanceKm: input.distanceKm,
      price,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    });

    const result = await this.matching.match(ride);
    return { ride: result.ride, matchedVendorIds: result.matchedVendorIds };
  }

  async getById(id: string, actor: Actor): Promise<RideWithParticipants | null> {
    const detail = await this.rides.findWithParticipants(id);
    if (!detail) return null;
    if (actor.role === 'CUSTOMER' && detail.ride.customerId !== actor.customerId) {
      return null;
    }
    return detail;
  }

  async cancelByCustomer(rideId: string, customerId: string): Promise<Ride> {
    const ride = await this.rides.findById(rideId);
    if (!ride) throw new NotFoundError(`No ride with id "${rideId}"`);
    if (ride.customerId !== customerId) {
      throw new ForbiddenError('You can only cancel your own rides');
    }
    return this.cancel(ride);
  }

  async cancelByOps(rideId: string): Promise<Ride> {
    const ride = await this.rides.findById(rideId);
    if (!ride) throw new NotFoundError(`No ride with id "${rideId}"`);
    return this.cancel(ride);
  }

  private async cancel(ride: Ride): Promise<Ride> {
    if (!isCancellable(ride.status)) {
      throw new RideStateTransitionError(`Cannot cancel a ride in status ${ride.status}`);
    }

    let assignedChauffeurId: string | undefined;
    const cancelled = await this.withTransaction(async (tx) => {
      const fresh = await tx.rides.findById(ride.id);
      if (!fresh) throw new NotFoundError(`No ride with id "${ride.id}"`);
      if (!isCancellable(fresh.status)) {
        throw new RideStateTransitionError(`Cannot cancel a ride in status ${fresh.status}`);
      }

      const at = new Date().toISOString();
      const offers = await tx.rideOffers.listByRideId(ride.id);
      const accepted = offers.find((offer) => offer.status === 'ACCEPTED');
      assignedChauffeurId = accepted?.chauffeurId;
      for (const offer of offers) {
        if (offer.status === 'ACCEPTED' || offer.status === 'PENDING') {
          await tx.rideOffers.release(offer.id, at);
        }
        if (offer.status === 'ACCEPTED') {
          if (offer.vendorCarId !== undefined) {
            await tx.vendorCars.updateAvailability(offer.vendorCarId, true);
          }
          if (offer.chauffeurId !== undefined) {
            await tx.chauffeurs.updateStatus(offer.chauffeurId, 'AVAILABLE');
          }
        }
      }
      return tx.rides.cancel(ride.id, at);
    });

    this.eventBus.emit({
      type: 'ride:cancelled',
      rideId: ride.id,
      ...(assignedChauffeurId !== undefined ? { chauffeurId: assignedChauffeurId } : {}),
    });
    return cancelled;
  }

  async getMine(actor: Actor): Promise<RideWithParticipants[]> {
    let rides: Ride[];
    switch (actor.role) {
      case 'CUSTOMER': {
        if (actor.customerId === undefined) return [];
        rides = await this.rides.listByCustomerId(actor.customerId);
        break;
      }
      case 'DRIVER': {
        if (actor.chauffeurId === undefined) return [];
        rides = await this.rides.listByChauffeurId(actor.chauffeurId);
        break;
      }
      case 'VENDOR': {
        if (actor.vendorId === undefined) return [];
        rides = await this.rides.listByVendorId(actor.vendorId);
        break;
      }
      case 'OPS': {
        rides = await this.rides.listAll();
        break;
      }
    }
    const detailed = await Promise.all(
      rides.map((ride) => this.rides.findWithParticipants(ride.id)),
    );
    return detailed.filter((item): item is RideWithParticipants => item !== null);
  }
}

function isCancellable(status: Ride['status']): boolean {
  return (CANCELLABLE_STATUSES as readonly string[]).includes(status);
}
