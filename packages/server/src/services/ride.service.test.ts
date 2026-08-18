import { beforeEach, describe, expect, it } from 'vitest';

import { createContainer, type Container } from '../config/container.js';
import { seed } from '../db/seed.js';
import {
  ForbiddenError,
  NotFoundError,
  RideStateTransitionError,
  ValidationError,
} from '../domain/errors/index.js';
import type { CreateRideInput } from './ride.service.js';

async function createSClassRide(container: Container, overrides: Partial<CreateRideInput> = {}) {
  return container.services.rides.create(
    {
      modelId: 'model-mercedes-sclass',
      pickup: 'Taj Palace, Mumbai',
      dropoff: 'JW Marriott, Mumbai',
      pickupTime: new Date(Date.now() + 3_600_000).toISOString(),
      distanceKm: 10,
      ...overrides,
    },
    'user-priya-nair',
  );
}

async function acceptFirstOffer(container: Container, rideId: string) {
  const offers = await container.repos.rideOffers.listByRideId(rideId);
  const companyOffer = offers.find((o) => o.vendorId === 'vendor-company');
  if (!companyOffer) throw new Error('no company offer');
  return container.services.offers.accept(companyOffer.id, 'vendor-company', {
    vendorCarId: 'car-company-1',
    chauffeurId: 'chauffeur-company-1',
  });
}

describe('RideService', () => {
  let container: Container;

  beforeEach(async () => {
    container = createContainer(':memory:', { runMigrations: true });
    await seed(container);
  });

  it('calculates price as basePrice + distanceKm x pricePerKm', async () => {
    const { ride } = await createSClassRide(container, { distanceKm: 10 });
    expect(ride.price).toBe(25000 + 10 * 45);
  });

  it('rounds fractional prices', async () => {
    const { ride } = await createSClassRide(container, { distanceKm: 2.4 });
    expect(ride.price).toBe(Math.round(25000 + 2.4 * 45));
  });

  it('rejects an unknown model', async () => {
    await expect(
      createSClassRide(container, { modelId: 'model-does-not-exist' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('rejects a pickupTime in the past', async () => {
    await expect(
      createSClassRide(container, { pickupTime: new Date(Date.now() - 3_600_000).toISOString() }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('blocks cancelling another customers ride', async () => {
    const { ride } = await createSClassRide(container);
    await expect(
      container.services.rides.cancelByCustomer(ride.id, 'user-arjun-mehta'),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('after accept, cancel releases offers and frees car and chauffeur', async () => {
    const { ride } = await createSClassRide(container);
    await acceptFirstOffer(container, ride.id);

    const cancelled = await container.services.rides.cancelByCustomer(ride.id, 'user-priya-nair');
    await flush();

    expect(cancelled.status).toBe('CANCELLED');
    expect(cancelled.cancelledAt).toBeTruthy();

    const offers = await container.repos.rideOffers.listByRideId(ride.id);
    for (const offer of offers) {
      expect(offer.status).toBe('RELEASED');
    }

    const car = await container.repos.vendorCars.findById('car-company-1');
    expect(car?.isAvailable).toBe(true);
    const chauffeur = await container.repos.chauffeurs.findById('chauffeur-company-1');
    expect(chauffeur?.status).toBe('AVAILABLE');

    const opsNotifications = await container.services.notifications.listFor({ role: 'OPS' });
    expect(opsNotifications.some((n) => n.type === 'ride:cancelled')).toBe(true);
    const vendorNotifications = await container.services.notifications.listFor({
      role: 'VENDOR',
      vendorId: 'vendor-company',
    });
    expect(vendorNotifications.some((n) => n.type === 'ride:cancelled')).toBe(true);
  });

  it('rejects cancelling a completed ride', async () => {
    const { ride } = await createSClassRide(container);
    const accepted = await acceptFirstOffer(container, ride.id);
    await container.services.ops.approveOffer(accepted.id);
    await container.services.drivers.start(ride.id, 'chauffeur-company-1');
    await container.services.drivers.complete(ride.id, 'chauffeur-company-1');

    await expect(container.services.rides.cancelByOps(ride.id)).rejects.toBeInstanceOf(
      RideStateTransitionError,
    );
  });

  it('lists rides per role', async () => {
    const { ride } = await createSClassRide(container);
    await flush();

    const customerRides = await container.services.rides.getMine({
      role: 'CUSTOMER',
      customerId: 'user-priya-nair',
    });
    expect(customerRides.map((r) => r.ride.id)).toContain(ride.id);

    const vendorRides = await container.services.rides.getMine({
      role: 'VENDOR',
      vendorId: 'vendor-company',
    });
    expect(vendorRides.map((r) => r.ride.id)).toContain(ride.id);

    const opsRides = await container.services.rides.getMine({ role: 'OPS' });
    expect(opsRides.map((r) => r.ride.id)).toContain(ride.id);

    const otherRides = await container.services.rides.getMine({
      role: 'CUSTOMER',
      customerId: 'user-arjun-mehta',
    });
    expect(otherRides).not.toContain(ride.id);
  });
});

async function flush(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}
