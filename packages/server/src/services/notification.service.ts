import type { ICarModelRepository } from '../db/interfaces/car-model.repository.js';
import type { IChauffeurRepository } from '../db/interfaces/chauffeur.repository.js';
import type { INotificationRepository } from '../db/interfaces/notification.repository.js';
import type { IRideOfferRepository } from '../db/interfaces/ride-offer.repository.js';
import type { IRideRepository } from '../db/interfaces/ride.repository.js';
import type { IUserRepository } from '../db/interfaces/user.repository.js';
import type { IVendorRepository } from '../db/interfaces/vendor.repository.js';
import type { Actor, Notification } from '../domain/entities/index.js';
import type { DomainEvent } from '../domain/events.js';

export interface NotificationService {
  persist(event: DomainEvent): Promise<void>;
  listFor(actor: Actor): Promise<Notification[]>;
  markRead(ids: string[]): Promise<void>;
}

export class DefaultNotificationService implements NotificationService {
  constructor(
    private readonly notifications: INotificationRepository,
    private readonly carModels: ICarModelRepository,
    private readonly vendors: IVendorRepository,
    private readonly chauffeurs: IChauffeurRepository,
    private readonly users: IUserRepository,
    private readonly rides: IRideRepository,
    private readonly rideOffers: IRideOfferRepository,
  ) {}

  async persist(event: DomainEvent): Promise<void> {
    switch (event.type) {
      case 'ride:created':
        await this.onRideCreated(event);
        break;
      case 'offer:accepted':
        await this.onOfferAccepted(event);
        break;
      case 'ride:confirmed':
        await this.onRideConfirmed(event);
        break;
      case 'ride:cancelled':
        await this.onRideCancelled(event);
        break;
      case 'ride:started':
        await this.onRideStarted(event);
        break;
      case 'ride:completed':
        await this.onRideCompleted(event);
        break;
    }
  }

  async listFor(actor: Actor): Promise<Notification[]> {
    const recipientId = recipientIdFor(actor);
    return this.notifications.listFor(actor.role, recipientId);
  }

  async markRead(ids: string[]): Promise<void> {
    await this.notifications.markRead(ids);
  }

  private async onRideCreated(
    event: Extract<DomainEvent, { type: 'ride:created' }>,
  ): Promise<void> {
    const model = await this.carModels.findById(event.ride.modelId);
    const message = `New ride request for ${model?.name ?? 'your model'}`;
    for (const vendorId of event.matchedVendorIds) {
      await this.create({
        recipientRole: 'VENDOR',
        recipientId: vendorId,
        type: 'ride:new',
        message,
        payload: { rideId: event.ride.id, modelId: event.ride.modelId },
      });
    }
  }

  private async onOfferAccepted(
    event: Extract<DomainEvent, { type: 'offer:accepted' }>,
  ): Promise<void> {
    const vendor = await this.vendors.findById(event.vendorId);
    await this.create({
      recipientRole: 'OPS',
      recipientId: null,
      type: 'offer:accepted',
      message: `${vendor?.name ?? 'A vendor'} accepted a ride`,
      payload: {
        rideId: event.rideId,
        offerId: event.offerId,
        vendorId: event.vendorId,
        vendorCarId: event.vendorCarId,
        chauffeurId: event.chauffeurId,
      },
    });
  }

  private async onRideConfirmed(
    event: Extract<DomainEvent, { type: 'ride:confirmed' }>,
  ): Promise<void> {
    const ride = await this.rides.findById(event.rideId);
    await this.create({
      recipientRole: 'DRIVER',
      recipientId: event.chauffeurId,
      type: 'ride:confirmed',
      message: 'New ride confirmed, please be ready',
      payload: { rideId: event.rideId, vendorId: event.vendorId },
    });
    if (ride) {
      await this.create({
        recipientRole: 'CUSTOMER',
        recipientId: ride.customerId,
        type: 'ride:confirmed',
        message: 'Your ride is confirmed',
        payload: { rideId: event.rideId },
      });
    }
  }

  private async onRideCancelled(
    event: Extract<DomainEvent, { type: 'ride:cancelled' }>,
  ): Promise<void> {
    const ride = await this.rides.findById(event.rideId);
    const offers = await this.rideOffers.listByRideId(event.rideId);
    const vendorIds = [...new Set(offers.map((offer) => offer.vendorId))];

    await this.create({
      recipientRole: 'OPS',
      recipientId: null,
      type: 'ride:cancelled',
      message: 'A ride was cancelled',
      payload: { rideId: event.rideId },
    });
    for (const vendorId of vendorIds) {
      await this.create({
        recipientRole: 'VENDOR',
        recipientId: vendorId,
        type: 'ride:cancelled',
        message: 'A ride request was cancelled',
        payload: { rideId: event.rideId },
      });
    }
    if (event.chauffeurId !== undefined) {
      await this.create({
        recipientRole: 'DRIVER',
        recipientId: event.chauffeurId,
        type: 'ride:cancelled',
        message: 'Your assigned ride was cancelled',
        payload: { rideId: event.rideId },
      });
    }
    if (ride) {
      await this.create({
        recipientRole: 'CUSTOMER',
        recipientId: ride.customerId,
        type: 'ride:cancelled',
        message: 'Your ride was cancelled',
        payload: { rideId: event.rideId },
      });
    }
  }

  private async onRideStarted(
    event: Extract<DomainEvent, { type: 'ride:started' }>,
  ): Promise<void> {
    const ride = await this.rides.findById(event.rideId);
    const chauffeur = await this.chauffeurs.findById(event.chauffeurId);
    if (ride) {
      await this.create({
        recipientRole: 'CUSTOMER',
        recipientId: ride.customerId,
        type: 'ride:started',
        message: `Your chauffeur ${chauffeur?.name ?? ''} is on the way`,
        payload: { rideId: event.rideId, chauffeurId: event.chauffeurId },
      });
    }
  }

  private async onRideCompleted(
    event: Extract<DomainEvent, { type: 'ride:completed' }>,
  ): Promise<void> {
    const ride = await this.rides.findById(event.rideId);
    if (ride) {
      await this.create({
        recipientRole: 'CUSTOMER',
        recipientId: ride.customerId,
        type: 'ride:completed',
        message: 'Your ride is complete',
        payload: { rideId: event.rideId },
      });
    }
  }

  private create(input: {
    recipientRole: 'VENDOR' | 'OPS' | 'DRIVER' | 'CUSTOMER';
    recipientId: string | null;
    type:
      | 'ride:new'
      | 'offer:accepted'
      | 'ride:confirmed'
      | 'ride:cancelled'
      | 'ride:started'
      | 'ride:completed';
    message: string;
    payload: Record<string, unknown>;
  }): Promise<Notification> {
    return this.notifications.create({
      recipientRole: input.recipientRole,
      recipientId: input.recipientId,
      type: input.type,
      message: input.message,
      payload: input.payload,
      createdAt: new Date().toISOString(),
    });
  }
}

function recipientIdFor(actor: Actor): string | null {
  switch (actor.role) {
    case 'CUSTOMER':
      return actor.customerId ?? null;
    case 'VENDOR':
      return actor.vendorId ?? null;
    case 'DRIVER':
      return actor.chauffeurId ?? null;
    case 'OPS':
      return null;
  }
}
