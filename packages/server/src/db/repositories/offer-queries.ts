import { eq, type SQL } from 'drizzle-orm';

import type { RideOfferWithDetails } from '../../domain/entities/index.js';
import type { Db } from '../client.js';
import { chauffeurs, rideOffers, vendorCars, vendors } from '../schema/index.js';
import { toChauffeur, toRideOffer, toVendor, toVendorCar } from './mappers.js';

export async function queryOffersWithDetails(db: Db, where: SQL): Promise<RideOfferWithDetails[]> {
  const rows = await db
    .select({
      offer: rideOffers,
      vendor: vendors,
      vendorCar: vendorCars,
      chauffeur: chauffeurs,
    })
    .from(rideOffers)
    .innerJoin(vendors, eq(rideOffers.vendorId, vendors.id))
    .leftJoin(vendorCars, eq(rideOffers.vendorCarId, vendorCars.id))
    .leftJoin(chauffeurs, eq(rideOffers.chauffeurId, chauffeurs.id))
    .where(where)
    .orderBy(rideOffers.createdAt);

  return rows.map((row) => ({
    offer: toRideOffer(row.offer),
    vendor: toVendor(row.vendor),
    vendorCar: row.vendorCar ? toVendorCar(row.vendorCar) : null,
    chauffeur: row.chauffeur ? toChauffeur(row.chauffeur) : null,
  }));
}
