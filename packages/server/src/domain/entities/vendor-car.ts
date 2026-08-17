export interface VendorCar {
  id: string;
  vendorId: string;
  modelId: string;
  plateNumber: string;
  isAvailable: boolean;
}

export type NewVendorCar = Omit<VendorCar, 'id'>;
