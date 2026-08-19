import { beforeEach, describe, expect, it } from 'vitest';

import { createContainer, type Container } from '../config/container.js';
import { seed } from '../db/seed.js';
import { ForbiddenError, NotFoundError, RideStateTransitionError } from '../domain/errors/index.js';

async function createSClassRide(container: Container) {
  const result = await container.services.rides.create(
    {
      modelId: 'model-mercedes-sclass',
      pickup: 'Taj Palace, Mumbai',
      dropoff: 'JW Marriott, Mumbai',
      pickupTime: new Date(Date.now() + 3_600_000).toISOString(),
      distanceKm: 10,
    },
    'user-priya-nair',
  );
  const offers = await container.repos.rideOffers.listByRideId(result.ride.id);
  return { ride: result.ride, offers };
}

async function acceptCompanyOffer(container: Container, rideId: string) {
  const offers = await container.repos.rideOffers.listByRideId(rideId);
  const offer = offers.find((o) => o.vendorId === 'vendor-company');
  if (!offer) throw new Error('no company offer');
  return container.services.offers.accept(offer.id, 'vendor-company', {
    vendorCarId: 'car-company-1',
    chauffeurId: 'chauffeur-company-1',
  });
}

describe('OpsService', () => {
  let container: Container;

  beforeEach(async () => {
    container = createContainer(':memory:', { runMigrations: true });
    await seed(container);
  });

  it('approves an accepted offer: ride CONFIRMED, others REJECTED, locks freed', async () => {
    const { ride } = await createSClassRide(container);
    const accepted = await acceptCompanyOffer(container, ride.id);

    const confirmed = await container.services.ops.approveOffer(accepted.id);
    await flush();

    expect(confirmed.status).toBe('CONFIRMED');
    expect(confirmed.confirmedAt).toBeTruthy();

    const offers = await container.repos.rideOffers.listByRideId(ride.id);
    const companyOffer = offers.find((o) => o.vendorId === 'vendor-company');
    expect(companyOffer?.status).toBe('ACCEPTED');
    for (const offer of offers) {
      if (offer.vendorId !== 'vendor-company') {
        expect(offer.status).toBe('REJECTED');
      }
    }

    const car = await container.repos.vendorCars.findById('car-company-1');
    expect(car?.isAvailable).toBe(false);
    const chauffeur = await container.repos.chauffeurs.findById('chauffeur-company-1');
    expect(chauffeur?.status).toBe('ON_RIDE');

    const driverNotifications = await container.services.notifications.listFor({
      role: 'DRIVER',
      chauffeurId: 'chauffeur-company-1',
    });
    expect(driverNotifications.some((n) => n.type === 'ride:confirmed')).toBe(true);
    const customerNotifications = await container.services.notifications.listFor({
      role: 'CUSTOMER',
      customerId: 'user-priya-nair',
    });
    expect(customerNotifications.some((n) => n.type === 'ride:confirmed')).toBe(true);
  });

  it('is race-safe: a second approve on the same ride throws', async () => {
    const { ride } = await createSClassRide(container);
    const accepted = await acceptCompanyOffer(container, ride.id);

    await container.services.ops.approveOffer(accepted.id);
    await expect(container.services.ops.approveOffer(accepted.id)).rejects.toBeInstanceOf(
      RideStateTransitionError,
    );
  });

  it('rejects approving a non-accepted offer', async () => {
    const { offers } = await createSClassRide(container);
    const pending = offers.find((o) => o.vendorId === 'vendor-company');
    if (!pending) throw new Error('no company offer');

    await expect(container.services.ops.approveOffer(pending.id)).rejects.toBeInstanceOf(
      RideStateTransitionError,
    );
  });

  it('frees the non-winning accepted offer locks on approval', async () => {
    const { offers } = await createSClassRide(container);
    const mumbaiOffer = offers.find((o) => o.vendorId === 'vendor-mumbai-luxury');
    const companyOffer = offers.find((o) => o.vendorId === 'vendor-company');
    if (!mumbaiOffer || !companyOffer) throw new Error('missing offers');

    await container.services.offers.accept(mumbaiOffer.id, 'vendor-mumbai-luxury', {
      vendorCarId: 'car-mumbai-1',
      chauffeurId: 'chauffeur-mumbai-1',
    });
    await container.services.offers.accept(companyOffer.id, 'vendor-company', {
      vendorCarId: 'car-company-1',
      chauffeurId: 'chauffeur-company-1',
    });
    await container.services.ops.approveOffer(companyOffer.id);

    const freedCar = await container.repos.vendorCars.findById('car-mumbai-1');
    expect(freedCar?.isAvailable).toBe(true);
    const freedChauffeur = await container.repos.chauffeurs.findById('chauffeur-mumbai-1');
    expect(freedChauffeur?.status).toBe('AVAILABLE');
  });

  it('lists rides with a status filter and returns ride detail', async () => {
    const { ride } = await createSClassRide(container);

    const matching = await container.services.ops.listRides('MATCHING');
    expect(matching.map((r) => r.ride.id)).toContain(ride.id);

    const detail = await container.services.ops.getRideDetail(ride.id);
    expect(detail.ride.id).toBe(ride.id);
    expect(detail.model.name).toBe('Mercedes S-Class');
    expect(detail.customer.name).toBe('Priya Nair');

    await expect(container.services.ops.getRideDetail('ride-missing')).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});

describe('DriverService', () => {
  let container: Container;

  beforeEach(async () => {
    container = createContainer(':memory:', { runMigrations: true });
    await seed(container);
  });

  it('runs the full lifecycle: start, complete, frees car and chauffeur', async () => {
    const { ride } = await createSClassRide(container);
    const accepted = await acceptCompanyOffer(container, ride.id);
    await container.services.ops.approveOffer(accepted.id);

    const started = await container.services.drivers.start(ride.id, 'chauffeur-company-1');
    expect(started.status).toBe('STARTED');

    const completed = await container.services.drivers.complete(ride.id, 'chauffeur-company-1');
    expect(completed.status).toBe('COMPLETED');
    expect(completed.completedAt).toBeTruthy();
    await flush();

    const car = await container.repos.vendorCars.findById('car-company-1');
    expect(car?.isAvailable).toBe(true);
    const chauffeur = await container.repos.chauffeurs.findById('chauffeur-company-1');
    expect(chauffeur?.status).toBe('AVAILABLE');

    const notifications = await container.services.notifications.listFor({
      role: 'CUSTOMER',
      customerId: 'user-priya-nair',
    });
    const types = notifications.map((n) => n.type);
    expect(types).toContain('ride:started');
    expect(types).toContain('ride:completed');
  });

  it('rejects starting a ride that is not CONFIRMED', async () => {
    const { ride } = await createSClassRide(container);
    await acceptCompanyOffer(container, ride.id);

    await expect(
      container.services.drivers.start(ride.id, 'chauffeur-company-1'),
    ).rejects.toBeInstanceOf(RideStateTransitionError);
  });

  it('rejects completing a ride that is not STARTED', async () => {
    const { ride } = await createSClassRide(container);
    const accepted = await acceptCompanyOffer(container, ride.id);
    await container.services.ops.approveOffer(accepted.id);

    await expect(
      container.services.drivers.complete(ride.id, 'chauffeur-company-1'),
    ).rejects.toBeInstanceOf(RideStateTransitionError);
  });

  it('rejects a ride assigned to another chauffeur', async () => {
    const { ride } = await createSClassRide(container);
    const accepted = await acceptCompanyOffer(container, ride.id);
    await container.services.ops.approveOffer(accepted.id);

    await expect(
      container.services.drivers.start(ride.id, 'chauffeur-mumbai-1'),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});

async function flush(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}
