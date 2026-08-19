import { Router } from 'express';

import { AvailabilityToggleRequestSchema } from '@fleeted/shared';

import { validate } from '../middleware/validate.js';
import { requireRole } from '../middleware/require-role.js';
import { VendorController } from '../controllers/vendor.controller.js';
import type { OfferService } from '../services/offer.service.js';
import type { VendorService } from '../services/vendor.service.js';

export function createVendorRouter(offers: OfferService, vendors: VendorService): Router {
  const controller = new VendorController(offers, vendors);
  const router = Router();

  router.get('/:vendorId/offers', requireRole('VENDOR'), controller.listOffers);
  router.get('/:vendorId/cars', requireRole('VENDOR'), controller.listCars);
  router.post(
    '/:vendorId/cars/:carId/availability',
    requireRole('VENDOR'),
    validate(AvailabilityToggleRequestSchema),
    controller.setCarAvailability,
  );

  return router;
}
