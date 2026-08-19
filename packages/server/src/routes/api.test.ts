import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../app.js';
import { createContainer, type Container } from '../config/container.js';
import { seed } from '../db/seed.js';

const SECRET = 'test-secret-at-least-16-chars';

interface Client {
  token: string;
  post: (path: string, body?: unknown) => Promise<Response>;
  get: (path: string) => Promise<Response>;
}

async function login(baseUrl: string, role: string, name: string): Promise<Client> {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ role, name }),
  });
  const body = (await res.json()) as { token: string };
  const authHeaders = { authorization: `Bearer ${body.token}` };
  return {
    token: body.token,
    post: (path, payload) =>
      fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...authHeaders },
        ...(payload !== undefined ? { body: JSON.stringify(payload) } : {}),
      }),
    get: (path) => fetch(`${baseUrl}${path}`, { headers: authHeaders }),
  };
}

describe('REST API (HTTP)', () => {
  let container: Container;
  let server: Server;
  let baseUrl: string;
  let customer: Client;
  let vendor: Client;
  let ops: Client;

  beforeEach(async () => {
    container = createContainer(':memory:', { runMigrations: true, jwtSecret: SECRET });
    await seed(container);
    const app = createApp(container);
    server = app.listen(0);
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://localhost:${port}`;
    customer = await login(baseUrl, 'CUSTOMER', 'Priya Nair');
    vendor = await login(baseUrl, 'VENDOR', 'Royal Rides India');
    ops = await login(baseUrl, 'OPS', 'Ananya Desai');
  });

  afterEach(() => {
    server.close();
  });

  it('runs the full lifecycle over HTTP', async () => {
    const created = await customer.post('/api/rides', {
      modelId: 'model-lincoln-towncar',
      pickup: 'The Oberoi, New Delhi',
      dropoff: 'Leela Palace, New Delhi',
      pickupTime: new Date(Date.now() + 3_600_000).toISOString(),
      distanceKm: 15,
    });
    expect(created.status).toBe(201);
    const ride = (await created.json()) as { id: string; status: string; price: number };
    expect(ride.status).toBe('MATCHING');
    expect(ride.price).toBe(30000 + 15 * 50);

    const offersRes = await vendor.get('/api/vendors/vendor-royal-rides/offers');
    expect(offersRes.status).toBe(200);
    const offers = (await offersRes.json()) as {
      id: string;
      status: string;
      vendorId: string;
    }[];
    const pending = offers.find(
      (o) => o.vendorId === 'vendor-royal-rides' && o.status === 'PENDING',
    );
    expect(pending).toBeTruthy();

    const accepted = await vendor.post(`/api/offers/${pending?.id}/accept`, {
      vendorCarId: 'car-royal-1',
      chauffeurId: 'chauffeur-royal-1',
    });
    expect(accepted.status).toBe(200);
    expect(((await accepted.json()) as { status: string }).status).toBe('ACCEPTED');

    const approved = await ops.post(`/api/ops/offers/${pending?.id}/approve`);
    expect(approved.status).toBe(200);
    expect(((await approved.json()) as { status: string }).status).toBe('CONFIRMED');

    const assignedDriver = await login(baseUrl, 'DRIVER', 'Arjun Khanna');
    const started = await assignedDriver.post(`/api/driver/rides/${ride.id}/start`);
    expect(started.status).toBe(200);
    expect(((await started.json()) as { status: string }).status).toBe('STARTED');

    const completed = await assignedDriver.post(`/api/driver/rides/${ride.id}/complete`);
    expect(completed.status).toBe(200);
    expect(((await completed.json()) as { status: string }).status).toBe('COMPLETED');

    const detail = await ops.get(`/api/ops/rides/${ride.id}`);
    expect(detail.status).toBe(200);
    const detailBody = (await detail.json()) as {
      status: string;
      assignment: { vendor: { name: string }; chauffeur: { name: string } };
    };
    expect(detailBody.status).toBe('COMPLETED');
    expect(detailBody.assignment.vendor.name).toBe('Royal Rides India');
    expect(detailBody.assignment.chauffeur.name).toBe('Arjun Khanna');
  });

  it('cancel-after-accept releases offers over HTTP', async () => {
    const created = await customer.post('/api/rides', {
      modelId: 'model-rolls-ghost',
      pickup: 'Taj Palace, Mumbai',
      dropoff: 'JW Marriott, Mumbai',
      pickupTime: new Date(Date.now() + 3_600_000).toISOString(),
      distanceKm: 20,
    });
    const ride = (await created.json()) as { id: string };

    const offers = (await (await vendor.get('/api/vendors/vendor-royal-rides/offers')).json()) as {
      id: string;
      status: string;
      vendorId: string;
    }[];
    const pending = offers.find(
      (o) => o.vendorId === 'vendor-royal-rides' && o.status === 'PENDING',
    );
    await vendor.post(`/api/offers/${pending?.id}/accept`, {
      vendorCarId: 'car-royal-4',
      chauffeurId: 'chauffeur-royal-2',
    });

    const cancelled = await customer.post(`/api/rides/${ride.id}/cancel`);
    expect(cancelled.status).toBe(200);
    expect(((await cancelled.json()) as { status: string }).status).toBe('CANCELLED');

    const after = (await (await vendor.get('/api/vendors/vendor-royal-rides/offers')).json()) as {
      id: string;
      status: string;
    }[];
    const released = after.filter((o) => o.status === 'RELEASED');
    expect(released.length).toBeGreaterThan(0);

    const cars = (await (await vendor.get('/api/vendors/vendor-royal-rides/cars')).json()) as {
      cars: { id: string; isAvailable: boolean }[];
    };
    const car = cars.cars.find((c) => c.id === 'car-royal-4');
    expect(car?.isAvailable).toBe(true);
  });

  it('blocks role violations with 403 and missing tokens with 401', async () => {
    const customerOnOps = await customer.get('/api/ops/rides');
    expect(customerOnOps.status).toBe(403);

    const vendorOnDriver = await vendor.post('/api/driver/rides/x/start');
    expect(vendorOnDriver.status).toBe(403);

    const noToken = await fetch(`${baseUrl}/api/rides/mine`);
    expect(noToken.status).toBe(401);

    const vendorOnOtherFleet = await vendor.get('/api/vendors/vendor-company/cars');
    expect(vendorOnOtherFleet.status).toBe(403);
  });

  it('returns 400 for invalid input', async () => {
    const bad = await customer.post('/api/rides', {
      modelId: 'model-rolls-ghost',
      pickup: 'X',
      dropoff: 'Y',
      pickupTime: new Date(Date.now() - 3_600_000).toISOString(),
      distanceKm: -5,
    });
    expect(bad.status).toBe(400);
    const body = (await bad.json()) as { error: { code: string } };
    expect(body.error.code).toBe('VALIDATION');

    const unknownModel = await customer.post('/api/rides', {
      modelId: 'model-nope',
      pickup: 'X',
      dropoff: 'Y',
      pickupTime: new Date(Date.now() + 3_600_000).toISOString(),
      distanceKm: 10,
    });
    expect(unknownModel.status).toBe(404);
  });

  it('exposes notifications per role', async () => {
    await customer.post('/api/rides', {
      modelId: 'model-range-rover',
      pickup: 'Gateway of India',
      dropoff: 'Bandra, Mumbai',
      pickupTime: new Date(Date.now() + 3_600_000).toISOString(),
      distanceKm: 12,
    });
    const offers = (await (await vendor.get('/api/vendors/vendor-royal-rides/offers')).json()) as {
      id: string;
      status: string;
    }[];
    const pending = offers.find((o) => o.status === 'PENDING');
    await vendor.post(`/api/offers/${pending?.id}/accept`, {
      vendorCarId: 'car-royal-3',
      chauffeurId: 'chauffeur-royal-1',
    });

    const notificationsRes = await ops.get('/api/notifications');
    expect(notificationsRes.status).toBe(200);
    const notifications = (await notificationsRes.json()) as { type: string; id: string }[];
    expect(notifications.some((n) => n.type === 'offer:accepted')).toBe(true);

    const vendorNotifications = await vendor.get('/api/notifications');
    expect(vendorNotifications.status).toBe(200);
    const vendorList = (await vendorNotifications.json()) as { type: string }[];
    expect(vendorList.some((n) => n.type === 'ride:new')).toBe(true);

    const markRes = await ops.post('/api/notifications/read', {
      ids: [(notifications[0] as { id: string }).id],
    });
    expect(markRes.status).toBe(204);
  });

  it('serves the public catalog without a token', async () => {
    const res = await fetch(`${baseUrl}/api/car-models`);
    expect(res.status).toBe(200);
    const models = (await res.json()) as { name: string; basePrice: number }[];
    expect(models.length).toBe(5);
    expect(models[0]?.basePrice).toBeGreaterThan(0);
  });
});
