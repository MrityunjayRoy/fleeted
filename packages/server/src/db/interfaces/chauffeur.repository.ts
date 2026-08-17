import type { ChauffeurStatus } from '@fleeted/shared';

import type { Chauffeur, NewChauffeur } from '../../domain/entities/index.js';

export interface IChauffeurRepository {
  create(input: NewChauffeur): Promise<Chauffeur>;
  findById(id: string): Promise<Chauffeur | null>;
  findAvailableByVendorIds(vendorIds: string[]): Promise<Chauffeur[]>;
  updateStatus(id: string, status: ChauffeurStatus): Promise<Chauffeur>;
}
