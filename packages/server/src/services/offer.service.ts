import type { IChauffeurRepository } from '../db/interfaces/chauffeur.repository.js';
import type { IRideOfferRepository } from '../db/interfaces/ride-offer.repository.js';
import type { IVendorCarRepository } from '../db/interfaces/vendor-car.repository.js';
import type { TransactionRunner } from '../config/container.js';
import type { RideOffer, RideOfferWithDetails } from '../domain/entities/index.js';
import type { EventBus } from '../domain/events.js';
import {
  CarNotAvailableError,
  ChauffeurNotAvailableError,
  InsufficientVendorAccessError,
  NotFoundError,
  OfferAlreadyAcceptedError,
  OfferNotPendingError,
} from '../domain/errors/index.js';

export interface AcceptOfferInput {
  vendorCarId: string;
  chauffeurId: string;
}

export interface OfferService {
  accept(offerId: string, vendorId: string, input: AcceptOfferInput): Promise<RideOffer>;
  rejectRemaining(rideId: string, winningVendorId: string): Promise<void>;
  reject(offerId: string, vendorId: string): Promise<RideOffer>;
  getById(id: string): Promise<RideOfferWithDetails | null>;
  listByVendor(vendorId: string): Promise<RideOfferWithDetails[]>;
}

export class DefaultOfferService implements OfferService {
  constructor(
    private readonly rideOffers: IRideOfferRepository,
    private readonly vendorCars: IVendorCarRepository,
    private readonly chauffeurs: IChauffeurRepository,
    private readonly eventBus: EventBus,
    private readonly withTransaction: TransactionRunner,
  ) {}

  async accept(offerId: string, vendorId: string, input: AcceptOfferInput): Promise<RideOffer> {
    const offer = await this.rideOffers.findById(offerId);
    if (!offer) throw new NotFoundError(`No offer with id "${offerId}"`);
    if (offer.vendorId !== vendorId) {
      throw new InsufficientVendorAccessError('This offer belongs to another vendor');
    }
    if (offer.status === 'ACCEPTED') {
      throw new OfferAlreadyAcceptedError('This offer has already been accepted');
    }
    if (offer.status !== 'PENDING') {
      throw new OfferNotPendingError(`Offer is in status ${offer.status}, not PENDING`);
    }

    const car = await this.vendorCars.findById(input.vendorCarId);
    if (!car) throw new NotFoundError(`No vendor car with id "${input.vendorCarId}"`);
    if (car.vendorId !== vendorId) {
      throw new InsufficientVendorAccessError('This car belongs to another vendor');
    }
    if (!car.isAvailable) {
      throw new CarNotAvailableError('This car is already committed to another ride');
    }

    const chauffeur = await this.chauffeurs.findById(input.chauffeurId);
    if (!chauffeur) throw new NotFoundError(`No chauffeur with id "${input.chauffeurId}"`);
    if (chauffeur.vendorId !== vendorId) {
      throw new InsufficientVendorAccessError('This chauffeur belongs to another vendor');
    }
    if (chauffeur.status !== 'AVAILABLE') {
      throw new ChauffeurNotAvailableError(
        `Chauffeur is in status ${chauffeur.status}, not AVAILABLE`,
      );
    }

    const accepted = await this.withTransaction(async (tx) => {
      const fresh = await tx.rideOffers.findById(offerId);
      if (!fresh || fresh.status !== 'PENDING') {
        throw new OfferNotPendingError('This offer is no longer pending');
      }
      const freshCar = await tx.vendorCars.findById(input.vendorCarId);
      if (!freshCar || !freshCar.isAvailable) {
        throw new CarNotAvailableError('This car is already committed to another ride');
      }
      const freshChauffeur = await tx.chauffeurs.findById(input.chauffeurId);
      if (!freshChauffeur || freshChauffeur.status !== 'AVAILABLE') {
        throw new ChauffeurNotAvailableError('This chauffeur is already committed to another ride');
      }

      const at = new Date().toISOString();
      await tx.vendorCars.updateAvailability(input.vendorCarId, false);
      await tx.chauffeurs.updateStatus(input.chauffeurId, 'ON_RIDE');
      return tx.rideOffers.accept(offerId, input.vendorCarId, input.chauffeurId, at);
    });

    this.eventBus.emit({
      type: 'offer:accepted',
      offerId: accepted.id,
      rideId: accepted.rideId,
      vendorId: accepted.vendorId,
      vendorCarId: input.vendorCarId,
      chauffeurId: input.chauffeurId,
    });
    return accepted;
  }

  async getById(id: string): Promise<RideOfferWithDetails | null> {
    return this.rideOffers.findWithDetails(id);
  }

  async listByVendor(vendorId: string): Promise<RideOfferWithDetails[]> {
    const offers = await this.rideOffers.listByVendorId(vendorId);
    const detailed = await Promise.all(
      offers.map((offer) => this.rideOffers.findWithDetails(offer.id)),
    );
    return detailed.filter((item): item is RideOfferWithDetails => item !== null);
  }

  async reject(offerId: string, vendorId: string): Promise<RideOffer> {
    const offer = await this.rideOffers.findById(offerId);
    if (!offer) throw new NotFoundError(`No offer with id "${offerId}"`);
    if (offer.vendorId !== vendorId) {
      throw new InsufficientVendorAccessError('This offer belongs to another vendor');
    }
    if (offer.status !== 'PENDING') {
      throw new OfferNotPendingError(`Offer is in status ${offer.status}, not PENDING`);
    }
    return this.rideOffers.reject(offerId, new Date().toISOString());
  }

  async rejectRemaining(rideId: string, winningVendorId: string): Promise<void> {
    const offers = await this.rideOffers.listByRideId(rideId);
    const at = new Date().toISOString();
    for (const offer of offers) {
      if (offer.vendorId !== winningVendorId && offer.status === 'PENDING') {
        await this.rideOffers.reject(offer.id, at);
      }
    }
  }
}
