import { Router } from 'express';

import { CreateRideRequestSchema } from '@fleeted/shared';

import { validate } from '../middleware/validate.js';
import { requireRole } from '../middleware/require-role.js';
import { RideController } from '../controllers/ride.controller.js';
import type { RideService } from '../services/ride.service.js';

export function createRideRouter(rides: RideService): Router {
  const controller = new RideController(rides);
  const router = Router();

  router.post('/', requireRole('CUSTOMER'), validate(CreateRideRequestSchema), controller.create);
  router.get('/mine', requireRole('CUSTOMER', 'DRIVER', 'VENDOR'), controller.mine);
  router.get('/:id', requireRole('CUSTOMER', 'OPS'), controller.getById);
  router.post('/:id/cancel', requireRole('CUSTOMER', 'OPS'), controller.cancel);

  return router;
}
