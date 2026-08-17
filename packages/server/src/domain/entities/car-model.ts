import type { CarCategory } from '@fleeted/shared';

export interface CarModel {
  id: string;
  name: string;
  category: CarCategory;
  basePrice: number;
  pricePerKm: number;
  capacity: number;
  description: string;
}

export type NewCarModel = Omit<CarModel, 'id'>;
