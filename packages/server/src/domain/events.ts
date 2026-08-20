import { EventEmitter } from 'node:events';

import type { Ride } from './entities/index.js';

export interface RideCreatedEvent {
  type: 'ride:created';
  ride: Ride;
  matchedVendorIds: string[];
}

export interface OfferAcceptedEvent {
  type: 'offer:accepted';
  offerId: string;
  rideId: string;
  vendorId: string;
  vendorCarId: string;
  chauffeurId: string;
}

export interface RideConfirmedEvent {
  type: 'ride:confirmed';
  rideId: string;
  vendorId: string;
  chauffeurId: string;
}

export interface RideCancelledEvent {
  type: 'ride:cancelled';
  rideId: string;
  chauffeurId?: string;
}

export interface RideStartedEvent {
  type: 'ride:started';
  rideId: string;
  chauffeurId: string;
}

export interface RideCompletedEvent {
  type: 'ride:completed';
  rideId: string;
  chauffeurId: string;
}

export type DomainEvent =
  | RideCreatedEvent
  | OfferAcceptedEvent
  | RideConfirmedEvent
  | RideCancelledEvent
  | RideStartedEvent
  | RideCompletedEvent;

export type DomainEventType = DomainEvent['type'];

export type DomainEventOf<T extends DomainEventType> = Extract<DomainEvent, { type: T }>;

export interface EventBus {
  on<T extends DomainEventType>(type: T, handler: (event: DomainEventOf<T>) => void): void;
  emit(event: DomainEvent): void;
}

export class DefaultEventBus implements EventBus {
  private readonly emitter = new EventEmitter();

  on<T extends DomainEventType>(type: T, handler: (event: DomainEventOf<T>) => void): void {
    this.emitter.on(type, handler);
  }

  emit(event: DomainEvent): void {
    this.emitter.emit(event.type, event);
  }
}

export const DOMAIN_EVENT_TYPES: DomainEventType[] = [
  'ride:created',
  'offer:accepted',
  'ride:confirmed',
  'ride:cancelled',
  'ride:started',
  'ride:completed',
];
