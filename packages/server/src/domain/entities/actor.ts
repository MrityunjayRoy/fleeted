import type { Role } from '@fleeted/shared';

export interface Actor {
  role: Role;
  customerId?: string;
  vendorId?: string;
  chauffeurId?: string;
}
