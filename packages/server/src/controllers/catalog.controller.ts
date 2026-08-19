import type { Request, Response } from 'express';

import type { ICarModelRepository } from '../db/interfaces/car-model.repository.js';
import { toCarModelDto } from '../dto/mappers.js';

export class CatalogController {
  constructor(private readonly carModels: ICarModelRepository) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    const models = await this.carModels.findAll();
    res.json(models.map(toCarModelDto));
  };
}
