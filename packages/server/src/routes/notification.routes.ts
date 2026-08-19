import { Router } from 'express';

import { MarkReadRequestSchema } from '@fleeted/shared';

import { validate } from '../middleware/validate.js';
import { NotificationController } from '../controllers/notification.controller.js';
import type { NotificationService } from '../services/notification.service.js';

export function createNotificationRouter(notifications: NotificationService): Router {
  const controller = new NotificationController(notifications);
  const router = Router();

  router.get('/', controller.list);
  router.post('/read', validate(MarkReadRequestSchema), controller.markRead);

  return router;
}
