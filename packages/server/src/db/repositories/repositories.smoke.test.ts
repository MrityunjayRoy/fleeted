import { describe, expect, it, beforeEach } from 'vitest';

import { createContainer, type Container } from '../../config/container.js';

describe('repository facade smoke test', () => {
  let container: Container;

  beforeEach(() => {
    container = createContainer(':memory:', { runMigrations: true });
  });

  it('inserts and reads back a vendor, car and chauffeur through the repository facade', async () => {
    const { repos } = container;

    const vendor = await repos.vendors.create({
      name: 'Luxury Wheels',
      phone: '+91 98111 22233',
      isCompany: false,
    });
    expect(vendor.id).toBeTruthy();

    const model = await repos.carModels.create({
      name: 'Mercedes S-Class',
      category: 'Sedan',
      basePrice: 25000,
      pricePerKm: 45,
      capacity: 4,
      description: 'Flagship luxury sedan',
    });

    const car = await repos.vendorCars.create({
      vendorId: vendor.id,
      modelId: model.id,
      plateNumber: 'MH 01 AB 1234',
      isAvailable: true,
    });

    const chauffeur = await repos.chauffeurs.create({
      vendorId: vendor.id,
      name: 'Rakesh Kumar',
      phone: '+91 98222 33344',
      licenseNumber: 'MH-2020-004451',
      status: 'AVAILABLE',
    });

    const fetchedCar = await repos.vendorCars.findById(car.id);
    expect(fetchedCar).toMatchObject({
      id: car.id,
      vendorId: vendor.id,
      modelId: model.id,
      plateNumber: 'MH 01 AB 1234',
      isAvailable: true,
    });

    const availableCars = await repos.vendorCars.findAvailableByModelId(model.id);
    expect(availableCars).toHaveLength(1);
    expect(availableCars[0]?.id).toBe(car.id);

    const availableChauffeurs = await repos.chauffeurs.findAvailableByVendorIds([vendor.id]);
    expect(availableChauffeurs).toHaveLength(1);
    expect(availableChauffeurs[0]).toMatchObject({ id: chauffeur.id, status: 'AVAILABLE' });

    const fetchedVendor = await repos.vendors.findById(vendor.id);
    expect(fetchedVendor).toMatchObject({ name: 'Luxury Wheels', isCompany: false });

    const fetchedChauffeur = await repos.chauffeurs.findById(chauffeur.id);
    expect(fetchedChauffeur).toMatchObject({
      name: 'Rakesh Kumar',
      licenseNumber: 'MH-2020-004451',
    });
  });

  it('toggles car availability and chauffeur status through the facade', async () => {
    const { repos } = container;

    const vendor = await repos.vendors.create({
      name: 'Company Fleet',
      phone: '+91 90000 11111',
      isCompany: true,
    });
    const model = await repos.carModels.create({
      name: 'Rolls-Royce Ghost',
      category: 'Sedan',
      basePrice: 50000,
      pricePerKm: 90,
      capacity: 4,
      description: 'Ultra-luxury sedan',
    });
    const car = await repos.vendorCars.create({
      vendorId: vendor.id,
      modelId: model.id,
      plateNumber: 'MH 02 CD 5678',
      isAvailable: true,
    });
    const chauffeur = await repos.chauffeurs.create({
      vendorId: vendor.id,
      name: 'Amit Sharma',
      phone: '+91 98333 44455',
      licenseNumber: 'MH-2021-009812',
      status: 'AVAILABLE',
    });

    const lockedCar = await repos.vendorCars.updateAvailability(car.id, false);
    expect(lockedCar.isAvailable).toBe(false);
    expect(await repos.vendorCars.findAvailableByModelId(model.id)).toHaveLength(0);

    const busyChauffeur = await repos.chauffeurs.updateStatus(chauffeur.id, 'ON_RIDE');
    expect(busyChauffeur.status).toBe('ON_RIDE');
    expect(await repos.chauffeurs.findAvailableByVendorIds([vendor.id])).toHaveLength(0);

    await repos.vendorCars.updateAvailability(car.id, true);
    await repos.chauffeurs.updateStatus(chauffeur.id, 'AVAILABLE');
    expect(await repos.vendorCars.findAvailableByModelId(model.id)).toHaveLength(1);
    expect(await repos.chauffeurs.findAvailableByVendorIds([vendor.id])).toHaveLength(1);
  });

  it('creates and reads back a ride with participants and notifications', async () => {
    const { repos } = container;

    const customer = await repos.users.create({
      name: 'Priya Nair',
      phone: '+91 98444 55566',
      email: 'priya@example.com',
    });
    const vendor = await repos.vendors.create({
      name: 'Elite Chauffeurs',
      phone: '+91 97777 88899',
      isCompany: false,
    });
    const model = await repos.carModels.create({
      name: 'Range Rover Autobiography',
      category: 'SUV',
      basePrice: 35000,
      pricePerKm: 55,
      capacity: 5,
      description: 'Luxury SUV',
    });
    const car = await repos.vendorCars.create({
      vendorId: vendor.id,
      modelId: model.id,
      plateNumber: 'KA 05 EF 9012',
      isAvailable: true,
    });
    const chauffeur = await repos.chauffeurs.create({
      vendorId: vendor.id,
      name: 'Vikram Rao',
      phone: '+91 98888 99900',
      licenseNumber: 'KA-2019-003344',
      status: 'AVAILABLE',
    });

    const ride = await repos.rides.create({
      customerId: customer.id,
      modelId: model.id,
      pickup: 'Bandra, Mumbai',
      dropoff: 'Juhu, Mumbai',
      pickupTime: '2026-08-25T10:00:00.000Z',
      distanceKm: 12,
      price: 25000 + 12 * 45,
      status: 'PENDING',
      createdAt: '2026-08-17T08:00:00.000Z',
    });

    const offer = await repos.rideOffers.create({
      rideId: ride.id,
      vendorId: vendor.id,
      status: 'PENDING',
      createdAt: '2026-08-17T08:00:01.000Z',
    });

    const accepted = await repos.rideOffers.accept(
      offer.id,
      car.id,
      chauffeur.id,
      '2026-08-17T08:05:00.000Z',
    );
    expect(accepted.status).toBe('ACCEPTED');
    expect(accepted.vendorCarId).toBe(car.id);
    expect(accepted.chauffeurId).toBe(chauffeur.id);
    expect(accepted.acceptedAt).toBe('2026-08-17T08:05:00.000Z');

    const confirmed = await repos.rides.confirm(ride.id, '2026-08-17T08:10:00.000Z');
    expect(confirmed.status).toBe('CONFIRMED');
    expect(confirmed.confirmedAt).toBe('2026-08-17T08:10:00.000Z');

    const withParticipants = await repos.rides.findWithParticipants(ride.id);
    expect(withParticipants).not.toBeNull();
    expect(withParticipants?.customer).toMatchObject({ name: 'Priya Nair' });
    expect(withParticipants?.model.id).toBe(model.id);
    expect(withParticipants?.offers).toHaveLength(1);
    expect(withParticipants?.offers[0]).toMatchObject({
      vendor: { id: vendor.id },
      vendorCar: { id: car.id },
      chauffeur: { id: chauffeur.id },
    });

    const notification = await repos.notifications.create({
      recipientRole: 'CUSTOMER',
      recipientId: customer.id,
      type: 'ride:confirmed',
      message: 'Your ride is confirmed',
      payload: { rideId: ride.id },
      createdAt: '2026-08-17T08:10:00.000Z',
    });
    expect(notification.read).toBe(false);

    const list = await repos.notifications.listFor('CUSTOMER', customer.id);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ type: 'ride:confirmed', payload: { rideId: ride.id } });

    await repos.notifications.markRead([notification.id]);
    const read = await repos.notifications.listFor('CUSTOMER', customer.id);
    expect(read[0]?.read).toBe(true);
  });
});
