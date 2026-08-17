import type { NotificationType, Role } from '@fleeted/shared';

export interface Notification {
  id: string;
  recipientRole: Role;
  recipientId: string | null;
  type: NotificationType;
  message: string;
  payload: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export type NewNotification = Omit<Notification, 'id' | 'read'>;
