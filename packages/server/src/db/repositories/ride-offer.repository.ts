import { randomUUID } from 'node:crypto';

import { desc, eq } from 'drizzle-orm';

import type { NewRideOffer, RideOffer, RideOfferWithDetails } from '../../domain/entities/index.js';
import type { Db } from '../client.js';
import { rideOffers } from '../schema/index.js';
import type { IRideOfferRepository } from '../interfaces/ride-offer.repository.js';
import { requireOne } from './helpers.js';
import { toRideOffer } from './mappers.js';
import { queryOffersWithDetails } from './offer-queries.js';

export class DrizzleRideOfferRepository implements IRideOfferRepository {
  constructor(private readonly db: Db) {}

  async create(input: NewRideOffer): Promise<RideOffer> {
    const row: RideOffer = { id: randomUUID(), ...input };
    await this.db.insert(rideOffers).values(row);
    return row;
  }

  async findById(id: string): Promise<RideOffer | null> {
    const rows = await this.db.select().from(rideOffers).where(eq(rideOffers.id, id)).limit(1);
    const row = rows[0];
    return row ? toRideOffer(row) : null;
  }

  async findWithDetails(id: string): Promise<RideOfferWithDetails | null> {
    const rows = await queryOffersWithDetails(this.db, eq(rideOffers.id, id));
    const row = rows[0];
    return row ?? null;
  }

  async listByRideId(rideId: string): Promise<RideOffer[]> {
    const rows = await this.db
      .select()
      .from(rideOffers)
      .where(eq(rideOffers.rideId, rideId))
      .orderBy(desc(rideOffers.createdAt));
    return rows.map(toRideOffer);
  }

  async listByRideIdWithDetails(rideId: string): Promise<RideOfferWithDetails[]> {
    return queryOffersWithDetails(this.db, eq(rideOffers.rideId, rideId));
  }

  async listByVendorId(vendorId: string): Promise<RideOffer[]> {
    const rows = await this.db
      .select()
      .from(rideOffers)
      .where(eq(rideOffers.vendorId, vendorId))
      .orderBy(desc(rideOffers.createdAt));
    return rows.map(toRideOffer);
  }

  async accept(
    id: string,
    vendorCarId: string,
    chauffeurId: string,
    at: string,
  ): Promise<RideOffer> {
    const rows = await this.db
      .update(rideOffers)
      .set({ vendorCarId, chauffeurId, status: 'ACCEPTED', acceptedAt: at })
      .where(eq(rideOffers.id, id))
      .returning();
    return toRideOffer(requireOne(rows, id));
  }

  async reject(id: string, at: string): Promise<RideOffer> {
    const rows = await this.db
      .update(rideOffers)
      .set({ status: 'REJECTED', rejectedAt: at })
      .where(eq(rideOffers.id, id))
      .returning();
    return toRideOffer(requireOne(rows, id));
  }

  async release(id: string, at: string): Promise<RideOffer> {
    const rows = await this.db
      .update(rideOffers)
      .set({ status: 'RELEASED', releasedAt: at })
      .where(eq(rideOffers.id, id))
      .returning();
    return toRideOffer(requireOne(rows, id));
  }
}
