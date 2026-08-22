import { beforeEach, describe, expect, it } from 'vitest';

import { createContainer, type Container } from '../config/container.js';
import { seed } from '../db/seed.js';
import {
  CarNotAvailableError,
  ChauffeurNotAvailableError,
  InsufficientVendorAccessError,
  OfferAlreadyAcceptedError,
  OfferNotPendingError,
} from '../domain/errors/index.js';

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

describe('OfferService', () => {
  let container: Container;

  beforeEach(async () => {
    container = createContainer(':memory:', { runMigrations: true });
    await seed(container);
  });

  it('lists vendor offers with embedded ride and model details', async () => {
    const { ride } = await createSClassRide(container);

    const offers = await container.services.offers.listByVendor('vendor-company');
    const offer = offers.find((o) => o.offer.rideId === ride.id);
    if (!offer) throw new Error('no company offer');

    expect(offer.ride).not.toBeNull();
    expect(offer.ride?.id).toBe(ride.id);
    expect(offer.ride?.pickup).toBe('Taj Palace, Mumbai');
    expect(offer.ride?.price).toBe(ride.price);
    expect(offer.model?.name).toBe('Mercedes S-Class');
    expect(offer.model?.basePrice).toBe(25000);
  });

  it('vendor rejects a pending offer', async () => {
    const { offers } = await createSClassRide(container);
    const offer = offers.find((o) => o.vendorId === 'vendor-mumbai-luxury');
    if (!offer) throw new Error('no mumbai offer');

    const rejected = await container.services.offers.reject(offer.id, 'vendor-mumbai-luxury');
    expect(rejected.status).toBe('REJECTED');
    expect(rejected.rejectedAt).toBeTruthy();

    await expect(
      container.services.offers.reject(offer.id, 'vendor-mumbai-luxury'),
    ).rejects.toBeInstanceOf(OfferNotPendingError);
    await expect(
      container.services.offers.reject(offer.id, 'vendor-royal-rides'),
    ).rejects.toBeInstanceOf(InsufficientVendorAccessError);
  });

  it('accepts a pending offer and locks car and chauffeur', async () => {
    const { offers } = await createSClassRide(container);
    const offer = offers.find((o) => o.vendorId === 'vendor-company');
    if (!offer) throw new Error('no company offer');

    const accepted = await container.services.offers.accept(offer.id, 'vendor-company', {
      vendorCarId: 'car-company-1',
      chauffeurId: 'chauffeur-company-1',
    });
    await flush();

    expect(accepted.status).toBe('ACCEPTED');
    expect(accepted.vendorCarId).toBe('car-company-1');
    expect(accepted.chauffeurId).toBe('chauffeur-company-1');
    expect(accepted.acceptedAt).toBeTruthy();

    const car = await container.repos.vendorCars.findById('car-company-1');
    expect(car?.isAvailable).toBe(false);
    const chauffeur = await container.repos.chauffeurs.findById('chauffeur-company-1');
    expect(chauffeur?.status).toBe('ON_RIDE');

    const opsNotifications = await container.services.notifications.listFor({ role: 'OPS' });
    expect(opsNotifications.some((n) => n.type === 'offer:accepted')).toBe(true);
  });

  it('rejects accepting an already accepted offer', async () => {
    const { offers } = await createSClassRide(container);
    const offer = offers.find((o) => o.vendorId === 'vendor-company');
    if (!offer) throw new Error('no company offer');

    await container.services.offers.accept(offer.id, 'vendor-company', {
      vendorCarId: 'car-company-1',
      chauffeurId: 'chauffeur-company-1',
    });
    await expect(
      container.services.offers.accept(offer.id, 'vendor-company', {
        vendorCarId: 'car-company-2',
        chauffeurId: 'chauffeur-company-2',
      }),
    ).rejects.toBeInstanceOf(OfferAlreadyAcceptedError);
  });

  it('rejects accepting an offer that was released', async () => {
    const { offers } = await createSClassRide(container);
    const offer = offers.find((o) => o.vendorId === 'vendor-company');
    if (!offer) throw new Error('no company offer');
    await container.repos.rideOffers.release(offer.id, new Date().toISOString());

    await expect(
      container.services.offers.accept(offer.id, 'vendor-company', {
        vendorCarId: 'car-company-1',
        chauffeurId: 'chauffeur-company-1',
      }),
    ).rejects.toBeInstanceOf(OfferNotPendingError);
  });

  it('rejects a car that is already committed', async () => {
    const { offers } = await createSClassRide(container);
    const offer = offers.find((o) => o.vendorId === 'vendor-company');
    if (!offer) throw new Error('no company offer');
    await container.repos.vendorCars.updateAvailability('car-company-1', false);

    await expect(
      container.services.offers.accept(offer.id, 'vendor-company', {
        vendorCarId: 'car-company-1',
        chauffeurId: 'chauffeur-company-1',
      }),
    ).rejects.toBeInstanceOf(CarNotAvailableError);
  });

  it('rejects a chauffeur that is already on a ride', async () => {
    const { offers } = await createSClassRide(container);
    const offer = offers.find((o) => o.vendorId === 'vendor-company');
    if (!offer) throw new Error('no company offer');
    await container.repos.chauffeurs.updateStatus('chauffeur-company-1', 'ON_RIDE');

    await expect(
      container.services.offers.accept(offer.id, 'vendor-company', {
        vendorCarId: 'car-company-1',
        chauffeurId: 'chauffeur-company-1',
      }),
    ).rejects.toBeInstanceOf(ChauffeurNotAvailableError);
  });

  it('rejects an offer belonging to another vendor', async () => {
    const { offers } = await createSClassRide(container);
    const offer = offers.find((o) => o.vendorId === 'vendor-mumbai-luxury');
    if (!offer) throw new Error('no mumbai offer');

    await expect(
      container.services.offers.accept(offer.id, 'vendor-company', {
        vendorCarId: 'car-company-1',
        chauffeurId: 'chauffeur-company-1',
      }),
    ).rejects.toBeInstanceOf(InsufficientVendorAccessError);
  });

  it('rejects a car or chauffeur from another vendor', async () => {
    const { offers } = await createSClassRide(container);
    const offer = offers.find((o) => o.vendorId === 'vendor-company');
    if (!offer) throw new Error('no company offer');

    await expect(
      container.services.offers.accept(offer.id, 'vendor-company', {
        vendorCarId: 'car-mumbai-1',
        chauffeurId: 'chauffeur-company-1',
      }),
    ).rejects.toBeInstanceOf(InsufficientVendorAccessError);

    await expect(
      container.services.offers.accept(offer.id, 'vendor-company', {
        vendorCarId: 'car-company-1',
        chauffeurId: 'chauffeur-mumbai-1',
      }),
    ).rejects.toBeInstanceOf(InsufficientVendorAccessError);
  });

  it('rejects remaining pending offers, keeping the winner', async () => {
    const { offers } = await createSClassRide(container);

    await container.services.offers.rejectRemaining(offers[0]!.rideId, 'vendor-mumbai-luxury');

    const after = await container.repos.rideOffers.listByRideId(offers[0]!.rideId);
    const winner = after.find((o) => o.vendorId === 'vendor-mumbai-luxury');
    expect(winner?.status).toBe('PENDING');
    const loser = after.find((o) => o.vendorId === 'vendor-company');
    expect(loser?.status).toBe('REJECTED');
  });
});

async function flush(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}
