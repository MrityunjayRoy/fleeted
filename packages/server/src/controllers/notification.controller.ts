import type { Request, Response } from 'express';

import { MarkReadRequestSchema } from '@fleeted/shared';

import { toNotificationDto } from '../dto/mappers.js';
import { UnauthorizedError } from '../domain/errors/index.js';
import type { Actor } from '../domain/entities/index.js';
import type { NotificationService } from '../services/notification.service.js';

export class NotificationController {
  constructor(private readonly notifications: NotificationService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const notifications = await this.notifications.listFor(actorOf(req));
    res.json(notifications.map(toNotificationDto));
  };

  markRead = async (req: Request, res: Response): Promise<void> => {
    const input = MarkReadRequestSchema.parse(req.body);
    await this.notifications.markRead(input.ids);
    res.status(204).end();
  };
}

function actorOf(req: Request): Actor {
  const auth = req.auth;
  if (!auth) throw new UnauthorizedError();
  return {
    role: auth.role,
    ...(auth.customerId !== undefined ? { customerId: auth.customerId } : {}),
    ...(auth.vendorId !== undefined ? { vendorId: auth.vendorId } : {}),
    ...(auth.chauffeurId !== undefined ? { chauffeurId: auth.chauffeurId } : {}),
  };
}
