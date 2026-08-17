import type { Role } from '@fleeted/shared';

export interface Account {
  id: string;
  role: Role;
  name: string;
  userId?: string;
  vendorId?: string;
  chauffeurId?: string;
}

export type NewAccount = Omit<Account, 'id'>;
