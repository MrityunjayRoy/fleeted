import type { AddressInfo } from 'node:net';
import type { Server as HttpServer } from 'node:http';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { io, type Socket } from 'socket.io-client';

import { createApp } from '../app.js';
import { createContainer, type Container } from '../config/container.js';
import { seed } from '../db/seed.js';
import { createRealtimeGateway, type RealtimeGateway } from './gateway.js';

const SECRET = 'test-secret-at-least-16-chars';

function connect(port: number, token: string): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const socket = io(`http://localhost:${port}`, {
      auth: { token },
      transports: ['websocket'],
    });
    socket.on('ready', () => resolve(socket));
    socket.on('connect_error', reject);
  });
}

function waitFor<T>(socket: Socket, event: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout waiting for ${event}`)), 3000);
    socket.once(event, (data: T) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

describe('RealtimeGateway', () => {
  let container: Container;
  let httpServer: HttpServer;
  let gateway: RealtimeGateway;
  let port: number;
  const sockets: Socket[] = [];

  beforeEach(async () => {
    container = createContainer(':memory:', { runMigrations: true, jwtSecret: SECRET });
    await seed(container);
    const app = createApp(container);
    httpServer = app.listen(0);
    gateway = createRealtimeGateway(container);
    gateway.attach(httpServer);
    port = (httpServer.address() as AddressInfo).port;
  });

  afterEach(() => {
    for (const socket of sockets) socket.disconnect();
    sockets.length = 0;
    gateway.close();
    httpServer.close();
  });

  async function login(
    role: 'CUSTOMER' | 'VENDOR' | 'OPS' | 'DRIVER',
    name: string,
  ): Promise<string> {
    const result = await container.services.auth.login({ role, name });
    return result.token;
  }

  async function connectRole(
    role: 'CUSTOMER' | 'VENDOR' | 'OPS' | 'DRIVER',
    name: string,
  ): Promise<Socket> {
    const socket = await connect(port, await login(role, name));
    sockets.push(socket);
    return socket;
  }

  async function bookRide(customerId = 'user-priya-nair') {
    return container.services.rides.create(
      {
        modelId: 'model-lincoln-towncar',
        pickup: 'The Oberoi, New Delhi',
        dropoff: 'Leela Palace, New Delhi',
        pickupTime: new Date(Date.now() + 3_600_000).toISOString(),
        distanceKm: 15,
      },
      customerId,
    );
  }

  async function acceptRoyalOffer(rideId: string) {
    const offers = await container.repos.rideOffers.listByRideId(rideId);
    const offer = offers.find((o) => o.vendorId === 'vendor-royal-rides');
    if (!offer) throw new Error('no royal offer');
    return container.services.offers.accept(offer.id, 'vendor-royal-rides', {
      vendorCarId: 'car-royal-1',
      chauffeurId: 'chauffeur-royal-1',
    });
  }

  it('rejects handshakes with an invalid token', async () => {
    await expect(connect(port, 'not-a-token')).rejects.toThrow();
  });

  it('pushes ride:new to matched vendors on booking', async () => {
    const royal = await connectRole('VENDOR', 'Royal Rides India');
    const company = await connectRole('VENDOR', 'Fleeted Company Fleet');

    const event = waitFor<{ rideId: string; modelId: string }>(royal, 'ride:new');
    const { ride } = await bookRide();
    const payload = await event;

    expect(payload.rideId).toBe(ride.id);
    expect(payload.modelId).toBe('model-lincoln-towncar');
    expect(company.connected).toBe(true);
  });

  it('pushes ride:confirmed to driver, customer and ops after approval', async () => {
    const driver = await connectRole('DRIVER', 'Arjun Khanna');
    const customer = await connectRole('CUSTOMER', 'Priya Nair');
    const ops = await connectRole('OPS', 'Ananya Desai');

    const { ride } = await bookRide();
    const accepted = await acceptRoyalOffer(ride.id);

    const driverEvent = waitFor<{ rideId: string }>(driver, 'ride:confirmed');
    const customerEvent = waitFor<{ rideId: string }>(customer, 'ride:confirmed');
    const opsEvent = waitFor<{ rideId: string }>(ops, 'ride:confirmed');

    await container.services.ops.approveOffer(accepted.id);

    expect((await driverEvent).rideId).toBe(ride.id);
    expect((await customerEvent).rideId).toBe(ride.id);
    expect((await opsEvent).rideId).toBe(ride.id);

    const notifications = await container.services.notifications.listFor({
      role: 'DRIVER',
      chauffeurId: 'chauffeur-royal-1',
    });
    expect(notifications.some((n) => n.type === 'ride:confirmed')).toBe(true);
  });

  it('pushes ride:cancelled to all involved parties after cancel-after-accept', async () => {
    const driver = await connectRole('DRIVER', 'Arjun Khanna');
    const customer = await connectRole('CUSTOMER', 'Priya Nair');
    const ops = await connectRole('OPS', 'Ananya Desai');
    const royal = await connectRole('VENDOR', 'Royal Rides India');

    const { ride } = await bookRide();
    await acceptRoyalOffer(ride.id);

    const driverEvent = waitFor<{ rideId: string }>(driver, 'ride:cancelled');
    const customerEvent = waitFor<{ rideId: string }>(customer, 'ride:cancelled');
    const opsEvent = waitFor<{ rideId: string }>(ops, 'ride:cancelled');
    const vendorEvent = waitFor<{ rideId: string }>(royal, 'ride:cancelled');

    await container.services.rides.cancelByCustomer(ride.id, 'user-priya-nair');

    expect((await driverEvent).rideId).toBe(ride.id);
    expect((await customerEvent).rideId).toBe(ride.id);
    expect((await opsEvent).rideId).toBe(ride.id);
    expect((await vendorEvent).rideId).toBe(ride.id);
  });

  it('pushes ride:started and ride:completed to customer and driver', async () => {
    const driver = await connectRole('DRIVER', 'Arjun Khanna');
    const customer = await connectRole('CUSTOMER', 'Priya Nair');

    const { ride } = await bookRide();
    const accepted = await acceptRoyalOffer(ride.id);
    await container.services.ops.approveOffer(accepted.id);

    const startedDriver = waitFor<{ rideId: string }>(driver, 'ride:started');
    const startedCustomer = waitFor<{ rideId: string }>(customer, 'ride:started');
    await container.services.drivers.start(ride.id, 'chauffeur-royal-1');
    expect((await startedDriver).rideId).toBe(ride.id);
    expect((await startedCustomer).rideId).toBe(ride.id);

    const completedDriver = waitFor<{ rideId: string }>(driver, 'ride:completed');
    const completedCustomer = waitFor<{ rideId: string }>(customer, 'ride:completed');
    await container.services.drivers.complete(ride.id, 'chauffeur-royal-1');
    expect((await completedDriver).rideId).toBe(ride.id);
    expect((await completedCustomer).rideId).toBe(ride.id);
  });
});
