import type { CarModel, NewCarModel } from '../../domain/entities/index.js';

export interface ICarModelRepository {
  create(input: NewCarModel): Promise<CarModel>;
  findById(id: string): Promise<CarModel | null>;
  findAll(): Promise<CarModel[]>;
}
