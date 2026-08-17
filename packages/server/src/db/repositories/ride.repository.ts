import { randomUUID } from 'node:crypto';

import { and, desc, eq } from 'drizzle-orm';
import type { RideStatus } from '@fleeted/shared';

import type { NewRide, Ride, RideWithParticipants } from '../../domain/entities/index.js';
import type { Db } from '../client.js';
import { carModels, rideOffers, rides, users } from '../schema/index.js';
import type { IRideRepository } from '../interfaces/ride.repository.js';
import { requireOne } from './helpers.js';
import { toCarModel, toRide, toUser } from './mappers.js';
import { queryOffersWithDetails } from './offer-queries.js';

export class DrizzleRideRepository implements IRideRepository {
  constructor(private readonly db: Db) {}

  async create(input: NewRide & { id?: string }): Promise<Ride> {
    const row: Ride = { ...input, id: input.id ?? randomUUID() };
    await this.db.insert(rides).values(row);
    return row;
  }

  async findById(id: string): Promise<Ride | null> {
    const rows = await this.db.select().from(rides).where(eq(rides.id, id)).limit(1);
    const row = rows[0];
    return row ? toRide(row) : null;
  }

  async findWithParticipants(id: string): Promise<RideWithParticipants | null> {
    const rows = await this.db
      .select({ ride: rides, model: carModels, customer: users })
      .from(rides)
      .innerJoin(carModels, eq(rides.modelId, carModels.id))
      .innerJoin(users, eq(rides.customerId, users.id))
      .where(eq(rides.id, id))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    const offers = await queryOffersWithDetails(this.db, eq(rideOffers.rideId, id));
    return {
      ride: toRide(row.ride),
      model: toCarModel(row.model),
      customer: toUser(row.customer),
      offers,
    };
  }

  async listByCustomerId(customerId: string): Promise<Ride[]> {
    const rows = await this.db
      .select()
      .from(rides)
      .where(eq(rides.customerId, customerId))
      .orderBy(desc(rides.createdAt));
    return rows.map(toRide);
  }

  async listByChauffeurId(chauffeurId: string): Promise<Ride[]> {
    const rows = await this.db
      .select({ ride: rides })
      .from(rides)
      .innerJoin(rideOffers, eq(rideOffers.rideId, rides.id))
      .where(and(eq(rideOffers.chauffeurId, chauffeurId), eq(rideOffers.status, 'ACCEPTED')))
      .orderBy(desc(rides.createdAt));
    return rows.map((row) => toRide(row.ride));
  }

  async listByVendorId(vendorId: string): Promise<Ride[]> {
    const rows = await this.db
      .selectDistinct({ ride: rides })
      .from(rides)
      .innerJoin(rideOffers, eq(rideOffers.rideId, rides.id))
      .where(eq(rideOffers.vendorId, vendorId))
      .orderBy(desc(rides.createdAt));
    return rows.map((row) => toRide(row.ride));
  }

  async listAll(status?: RideStatus): Promise<Ride[]> {
    const query = this.db.select().from(rides);
    if (status) query.where(eq(rides.status, status));
    const rows = await query.orderBy(desc(rides.createdAt));
    return rows.map(toRide);
  }

  async moveToMatching(id: string): Promise<Ride> {
    const rows = await this.db
      .update(rides)
      .set({ status: 'MATCHING' })
      .where(eq(rides.id, id))
      .returning();
    return toRide(requireOne(rows, id));
  }

  async confirm(id: string, at: string): Promise<Ride> {
    const rows = await this.db
      .update(rides)
      .set({ status: 'CONFIRMED', confirmedAt: at })
      .where(eq(rides.id, id))
      .returning();
    return toRide(requireOne(rows, id));
  }

  async start(id: string, at: string): Promise<Ride> {
    const rows = await this.db
      .update(rides)
      .set({ status: 'STARTED', startedAt: at })
      .where(eq(rides.id, id))
      .returning();
    return toRide(requireOne(rows, id));
  }

  async complete(id: string, at: string): Promise<Ride> {
    const rows = await this.db
      .update(rides)
      .set({ status: 'COMPLETED', completedAt: at })
      .where(eq(rides.id, id))
      .returning();
    return toRide(requireOne(rows, id));
  }

  async cancel(id: string, at: string): Promise<Ride> {
    const rows = await this.db
      .update(rides)
      .set({ status: 'CANCELLED', cancelledAt: at })
      .where(eq(rides.id, id))
      .returning();
    return toRide(requireOne(rows, id));
  }
}
