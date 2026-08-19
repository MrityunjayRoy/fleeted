import { Router } from 'express';

import type { ICarModelRepository } from '../db/interfaces/car-model.repository.js';
import { CatalogController } from '../controllers/catalog.controller.js';

export function createCatalogRouter(carModels: ICarModelRepository): Router {
  const controller = new CatalogController(carModels);
  const router = Router();

  router.get('/', controller.list);

  return router;
}
