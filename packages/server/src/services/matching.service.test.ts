import { beforeEach, describe, expect, it } from 'vitest';

import { createContainer, type Container } from '../config/container.js';
import { seed } from '../db/seed.js';

async function createSClassRide(container: Container) {
  return container.services.rides.create(
    {
      modelId: 'model-mercedes-sclass',
      pickup: 'Taj Palace, Mumbai',
      dropoff: 'JW Marriott, Mumbai',
      pickupTime: new Date(Date.now() + 3_600_000).toISOString(),
      distanceKm: 10,
    },
    'user-priya-nair',
  );
}

describe('MatchingService', () => {
  let container: Container;

  beforeEach(async () => {
    container = createContainer(':memory:', { runMigrations: true });
    await seed(container);
  });

  it('matches only vendors with an available car and an available chauffeur', async () => {
    const { matchedVendorIds } = await createSClassRide(container);

    expect(matchedVendorIds.sort()).toEqual(
      ['vendor-company', 'vendor-mumbai-luxury', 'vendor-heritage-cars'].sort(),
    );
  });

  it('excludes vendors whose chauffeurs are unavailable', async () => {
    await container.repos.chauffeurs.updateStatus('chauffeur-heritage-1', 'ON_RIDE');
    await container.repos.chauffeurs.updateStatus('chauffeur-heritage-2', 'ON_RIDE');

    const { matchedVendorIds } = await createSClassRide(container);

    expect(matchedVendorIds).not.toContain('vendor-heritage-cars');
    expect(matchedVendorIds).toContain('vendor-company');
  });

  it('excludes vendors whose cars are unavailable', async () => {
    await container.repos.vendorCars.updateAvailability('car-company-1', false);
    await container.repos.vendorCars.updateAvailability('car-company-2', false);

    const { matchedVendorIds } = await createSClassRide(container);

    expect(matchedVendorIds).not.toContain('vendor-company');
    expect(matchedVendorIds).toContain('vendor-mumbai-luxury');
  });

  it('moves the ride to MATCHING and creates one PENDING offer per matched vendor', async () => {
    const { ride, matchedVendorIds } = await createSClassRide(container);

    expect(ride.status).toBe('MATCHING');
    const offers = await container.repos.rideOffers.listByRideId(ride.id);
    expect(offers).toHaveLength(matchedVendorIds.length);
    for (const offer of offers) {
      expect(offer.status).toBe('PENDING');
    }
  });

  it('emits ride:created notifications for matched vendors', async () => {
    await createSClassRide(container);
    await flush();

    const notifications = await container.services.notifications.listFor({
      role: 'VENDOR',
      vendorId: 'vendor-company',
    });
    expect(notifications.map((n) => n.type)).toContain('ride:new');
  });
});

async function flush(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}
