import { Router } from 'express';

import { AcceptOfferRequestSchema } from '@fleeted/shared';

import { validate } from '../middleware/validate.js';
import { requireRole } from '../middleware/require-role.js';
import { OfferController } from '../controllers/offer.controller.js';
import type { OfferService } from '../services/offer.service.js';

export function createOfferRouter(offers: OfferService): Router {
  const controller = new OfferController(offers);
  const router = Router();

  router.get('/:id', requireRole('VENDOR', 'OPS'), controller.getById);
  router.post(
    '/:id/accept',
    requireRole('VENDOR'),
    validate(AcceptOfferRequestSchema),
    controller.accept,
  );
  router.post('/:id/reject', requireRole('VENDOR'), controller.reject);

  return router;
}
