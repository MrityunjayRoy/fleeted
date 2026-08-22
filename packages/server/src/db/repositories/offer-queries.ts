import { eq, type SQL } from 'drizzle-orm';

import type { RideOfferWithDetails } from '../../domain/entities/index.js';
import type { Db } from '../client.js';
import { carModels, chauffeurs, rideOffers, rides, vendorCars, vendors } from '../schema/index.js';
import { toCarModel, toChauffeur, toRide, toRideOffer, toVendor, toVendorCar } from './mappers.js';

export async function queryOffersWithDetails(db: Db, where: SQL): Promise<RideOfferWithDetails[]> {
  const rows = await db
    .select({
      offer: rideOffers,
      vendor: vendors,
      ride: rides,
      model: carModels,
      vendorCar: vendorCars,
      chauffeur: chauffeurs,
    })
    .from(rideOffers)
    .innerJoin(vendors, eq(rideOffers.vendorId, vendors.id))
    .innerJoin(rides, eq(rideOffers.rideId, rides.id))
    .leftJoin(carModels, eq(rides.modelId, carModels.id))
    .leftJoin(vendorCars, eq(rideOffers.vendorCarId, vendorCars.id))
    .leftJoin(chauffeurs, eq(rideOffers.chauffeurId, chauffeurs.id))
    .where(where)
    .orderBy(rideOffers.createdAt);

  return rows.map((row) => ({
    offer: toRideOffer(row.offer),
    vendor: toVendor(row.vendor),
    ride: toRide(row.ride),
    model: row.model ? toCarModel(row.model) : null,
    vendorCar: row.vendorCar ? toVendorCar(row.vendorCar) : null,
    chauffeur: row.chauffeur ? toChauffeur(row.chauffeur) : null,
  }));
}
