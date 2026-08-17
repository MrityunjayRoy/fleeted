import type { Role } from '@fleeted/shared';

import type { NewNotification, Notification } from '../../domain/entities/index.js';

export interface INotificationRepository {
  create(input: NewNotification): Promise<Notification>;
  listFor(recipientRole: Role, recipientId: string | null): Promise<Notification[]>;
  markRead(ids: string[]): Promise<void>;
}
