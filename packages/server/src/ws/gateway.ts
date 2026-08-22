import type { Server as HttpServer } from 'node:http';

import { Server as SocketIOServer } from 'socket.io';

import type { Container } from '../config/container.js';
import type { AuthContext } from '../middleware/auth.js';
import { verifyToken } from '../middleware/auth.js';
import { WS_EVENTS } from '@fleeted/shared';

import type { DomainEvent } from '../domain/events.js';

export interface RealtimeGateway {
  attach(httpServer: HttpServer): void;
  close(): void;
}

export function createRealtimeGateway(container: Container): RealtimeGateway {
  const io = new SocketIOServer({ cors: { origin: '*' } });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (typeof token !== 'string') {
      next(new Error('Missing auth token'));
      return;
    }
    try {
      socket.data.auth = verifyToken(token, container.config.jwtSecret);
      next();
    } catch {
      next(new Error('Invalid auth token'));
    }
  });

  io.on('connection', (socket) => {
    const auth = socket.data.auth as AuthContext;
    for (const room of roomsFor(auth)) socket.join(room);
    socket.emit(WS_EVENTS.READY, { role: auth.role });
  });

  const emit = (event: DomainEvent): void => {
    switch (event.type) {
      case 'ride:created':
        for (const vendorId of event.matchedVendorIds) {
          io.to(`vendor:${vendorId}`).emit(WS_EVENTS.RIDE_NEW, {
            rideId: event.ride.id,
            modelId: event.ride.modelId,
          });
        }
        break;
      case 'offer:accepted':
        io.to(`vendor:${event.vendorId}`).emit(WS_EVENTS.OFFER_ACCEPTED, {
          offerId: event.offerId,
          rideId: event.rideId,
          vendorId: event.vendorId,
          vendorCarId: event.vendorCarId,
          chauffeurId: event.chauffeurId,
        });
        io.to('ops').emit(WS_EVENTS.OFFER_ACCEPTED, {
          offerId: event.offerId,
          rideId: event.rideId,
          vendorId: event.vendorId,
        });
        break;
      case 'ride:confirmed':
        void emitConfirmed(event);
        break;
      case 'ride:cancelled':
        void emitCancelled(event);
        break;
      case 'ride:started':
        void emitStarted(event);
        break;
      case 'ride:completed':
        void emitCompleted(event);
        break;
    }
  };

  async function emitConfirmed(
    event: Extract<DomainEvent, { type: 'ride:confirmed' }>,
  ): Promise<void> {
    const ride = await container.repos.rides.findById(event.rideId);
    const payload = {
      rideId: event.rideId,
      vendorId: event.vendorId,
      chauffeurId: event.chauffeurId,
    };
    io.to(`driver:${event.chauffeurId}`).emit(WS_EVENTS.RIDE_CONFIRMED, payload);
    io.to('ops').emit(WS_EVENTS.RIDE_CONFIRMED, payload);
    if (ride) io.to(`customer:${ride.customerId}`).emit(WS_EVENTS.RIDE_CONFIRMED, payload);
  }

  async function emitCancelled(
    event: Extract<DomainEvent, { type: 'ride:cancelled' }>,
  ): Promise<void> {
    const ride = await container.repos.rides.findById(event.rideId);
    const offers = await container.repos.rideOffers.listByRideId(event.rideId);
    const payload = { rideId: event.rideId };
    const vendorIds = [...new Set(offers.map((offer) => offer.vendorId))];
    for (const vendorId of vendorIds)
      io.to(`vendor:${vendorId}`).emit(WS_EVENTS.RIDE_CANCELLED, payload);
    if (event.chauffeurId !== undefined) {
      io.to(`driver:${event.chauffeurId}`).emit(WS_EVENTS.RIDE_CANCELLED, payload);
    }
    if (ride) io.to(`customer:${ride.customerId}`).emit(WS_EVENTS.RIDE_CANCELLED, payload);
    io.to('ops').emit(WS_EVENTS.RIDE_CANCELLED, payload);
  }

  async function emitStarted(event: Extract<DomainEvent, { type: 'ride:started' }>): Promise<void> {
    const ride = await container.repos.rides.findById(event.rideId);
    const payload = { rideId: event.rideId, chauffeurId: event.chauffeurId };
    io.to(`driver:${event.chauffeurId}`).emit(WS_EVENTS.RIDE_STARTED, payload);
    if (ride) io.to(`customer:${ride.customerId}`).emit(WS_EVENTS.RIDE_STARTED, payload);
  }

  async function emitCompleted(
    event: Extract<DomainEvent, { type: 'ride:completed' }>,
  ): Promise<void> {
    const ride = await container.repos.rides.findById(event.rideId);
    const payload = { rideId: event.rideId, chauffeurId: event.chauffeurId };
    io.to(`driver:${event.chauffeurId}`).emit(WS_EVENTS.RIDE_COMPLETED, payload);
    if (ride) io.to(`customer:${ride.customerId}`).emit(WS_EVENTS.RIDE_COMPLETED, payload);
  }

  container.eventBus.on('ride:created', emit);
  container.eventBus.on('offer:accepted', emit);
  container.eventBus.on('ride:confirmed', emit);
  container.eventBus.on('ride:cancelled', emit);
  container.eventBus.on('ride:started', emit);
  container.eventBus.on('ride:completed', emit);

  return {
    attach(httpServer: HttpServer): void {
      io.attach(httpServer);
    },
    close(): void {
      io.close();
    },
  };
}

function roomsFor(auth: AuthContext): string[] {
  switch (auth.role) {
    case 'CUSTOMER':
      return auth.customerId !== undefined ? [`customer:${auth.customerId}`] : [];
    case 'DRIVER':
      return auth.chauffeurId !== undefined ? [`driver:${auth.chauffeurId}`] : [];
    case 'VENDOR':
      return auth.vendorId !== undefined ? [`vendor:${auth.vendorId}`] : [];
    case 'OPS':
      return ['ops'];
  }
}
