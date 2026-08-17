import { randomUUID } from 'node:crypto';

import { and, eq, inArray } from 'drizzle-orm';
import type { ChauffeurStatus } from '@fleeted/shared';

import type { Chauffeur, NewChauffeur } from '../../domain/entities/index.js';
import type { Db } from '../client.js';
import { chauffeurs } from '../schema/index.js';
import type { IChauffeurRepository } from '../interfaces/chauffeur.repository.js';
import { toChauffeur } from './mappers.js';

export class DrizzleChauffeurRepository implements IChauffeurRepository {
  constructor(private readonly db: Db) {}

  async create(input: NewChauffeur & { id?: string }): Promise<Chauffeur> {
    const row: Chauffeur = { ...input, id: input.id ?? randomUUID() };
    await this.db.insert(chauffeurs).values(row);
    return row;
  }

  async findById(id: string): Promise<Chauffeur | null> {
    const rows = await this.db.select().from(chauffeurs).where(eq(chauffeurs.id, id)).limit(1);
    const row = rows[0];
    return row ? toChauffeur(row) : null;
  }

  async findAvailableByVendorIds(vendorIds: string[]): Promise<Chauffeur[]> {
    if (vendorIds.length === 0) return [];
    const rows = await this.db
      .select()
      .from(chauffeurs)
      .where(and(inArray(chauffeurs.vendorId, vendorIds), eq(chauffeurs.status, 'AVAILABLE')));
    return rows.map(toChauffeur);
  }

  async updateStatus(id: string, status: ChauffeurStatus): Promise<Chauffeur> {
    const rows = await this.db
      .update(chauffeurs)
      .set({ status })
      .where(eq(chauffeurs.id, id))
      .returning();
    const row = rows[0];
    if (!row) throw new Error(`chauffeur not found: ${id}`);
    return toChauffeur(row);
  }
}
