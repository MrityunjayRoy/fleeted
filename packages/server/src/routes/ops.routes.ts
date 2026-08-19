import { Router } from 'express';

import { requireRole } from '../middleware/require-role.js';
import { OpsController } from '../controllers/ops.controller.js';
import type { OpsService } from '../services/ops.service.js';
import type { RideService } from '../services/ride.service.js';

export function createOpsRouter(ops: OpsService, rides: RideService): Router {
  const controller = new OpsController(ops, rides);
  const router = Router();

  router.get('/rides', requireRole('OPS'), controller.listRides);
  router.get('/rides/:id', requireRole('OPS'), controller.getRideDetail);
  router.post('/offers/:id/approve', requireRole('OPS'), controller.approveOffer);
  router.post('/rides/:id/cancel', requireRole('OPS'), controller.cancelRide);

  return router;
}
