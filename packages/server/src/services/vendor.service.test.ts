import { beforeEach, describe, expect, it } from 'vitest';

import { createContainer, type Container } from '../config/container.js';
import { seed } from '../db/seed.js';
import { InsufficientVendorAccessError, NotFoundError } from '../domain/errors/index.js';

describe('VendorService', () => {
  let container: Container;

  beforeEach(async () => {
    container = createContainer(':memory:', { runMigrations: true });
    await seed(container);
  });

  it('lists only the vendor own cars and chauffeurs', async () => {
    const fleet = await container.services.vendors.listFleet('vendor-royal-rides');

    expect(fleet.cars).toHaveLength(4);
    expect(fleet.cars.every((c) => c.vendorId === 'vendor-royal-rides')).toBe(true);
    expect(fleet.cars.map((c) => c.plateNumber)).toContain('DL 03 EF 1111');

    expect(fleet.chauffeurs).toHaveLength(3);
    expect(fleet.chauffeurs.every((c) => c.vendorId === 'vendor-royal-rides')).toBe(true);
    expect(fleet.chauffeurs.map((c) => c.name)).toContain('Arjun Khanna');
  });

  it('toggles car availability for the owning vendor', async () => {
    await container.services.vendors.setCarAvailability('car-royal-1', 'vendor-royal-rides', false);
    expect((await container.repos.vendorCars.findById('car-royal-1'))?.isAvailable).toBe(false);

    await container.services.vendors.setCarAvailability('car-royal-1', 'vendor-royal-rides', true);
    expect((await container.repos.vendorCars.findById('car-royal-1'))?.isAvailable).toBe(true);
  });

  it('is a no-op when availability is unchanged', async () => {
    await expect(
      container.services.vendors.setCarAvailability('car-royal-1', 'vendor-royal-rides', true),
    ).resolves.toBeUndefined();
    expect((await container.repos.vendorCars.findById('car-royal-1'))?.isAvailable).toBe(true);
  });

  it('rejects toggling another vendors car', async () => {
    await expect(
      container.services.vendors.setCarAvailability('car-company-3', 'vendor-royal-rides', false),
    ).rejects.toBeInstanceOf(InsufficientVendorAccessError);
  });

  it('rejects toggling an unknown car', async () => {
    await expect(
      container.services.vendors.setCarAvailability('car-nope', 'vendor-royal-rides', false),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
