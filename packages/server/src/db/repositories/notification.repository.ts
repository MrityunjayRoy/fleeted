import { randomUUID } from 'node:crypto';

import { and, desc, eq, inArray, isNull } from 'drizzle-orm';
import type { Role } from '@fleeted/shared';

import type { NewNotification, Notification } from '../../domain/entities/index.js';
import type { Db } from '../client.js';
import { notifications } from '../schema/index.js';
import type { INotificationRepository } from '../interfaces/notification.repository.js';
import { toNotification } from './mappers.js';

export class DrizzleNotificationRepository implements INotificationRepository {
  constructor(private readonly db: Db) {}

  async create(input: NewNotification): Promise<Notification> {
    const row: Notification = {
      id: randomUUID(),
      ...input,
      read: false,
    };
    await this.db.insert(notifications).values({
      ...row,
      payload: JSON.stringify(row.payload),
    });
    return row;
  }

  async listFor(recipientRole: Role, recipientId: string | null): Promise<Notification[]> {
    const where =
      recipientId === null
        ? and(eq(notifications.recipientRole, recipientRole), isNull(notifications.recipientId))
        : and(
            eq(notifications.recipientRole, recipientRole),
            eq(notifications.recipientId, recipientId),
          );
    const rows = await this.db
      .select()
      .from(notifications)
      .where(where)
      .orderBy(desc(notifications.createdAt));
    return rows.map(toNotification);
  }

  async markRead(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.db.update(notifications).set({ read: true }).where(inArray(notifications.id, ids));
  }
}
