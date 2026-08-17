import type { ChauffeurStatus } from '@fleeted/shared';

export interface Chauffeur {
  id: string;
  vendorId: string;
  name: string;
  phone: string;
  licenseNumber: string;
  status: ChauffeurStatus;
}

export type NewChauffeur = Omit<Chauffeur, 'id'>;
