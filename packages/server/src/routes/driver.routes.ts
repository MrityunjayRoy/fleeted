import { Router } from 'express';

import { requireRole } from '../middleware/require-role.js';
import { DriverController } from '../controllers/driver.controller.js';
import type { DriverService } from '../services/driver.service.js';
import type { RideService } from '../services/ride.service.js';

export function createDriverRouter(drivers: DriverService, rides: RideService): Router {
  const controller = new DriverController(drivers, rides);
  const router = Router();

  router.post('/rides/:id/start', requireRole('DRIVER'), controller.start);
  router.post('/rides/:id/complete', requireRole('DRIVER'), controller.complete);

  return router;
}
