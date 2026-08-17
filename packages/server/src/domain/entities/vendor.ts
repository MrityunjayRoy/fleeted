export interface Vendor {
  id: string;
  name: string;
  phone: string;
  isCompany: boolean;
}

export type NewVendor = Omit<Vendor, 'id'>;
