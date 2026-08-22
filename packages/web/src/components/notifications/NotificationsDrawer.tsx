'use client';

import { useState } from 'react';

import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { timeAgo } from '../../lib/format';
import { SWR_KEYS, useNotifications } from '../../lib/swr-hooks';
import { useSWRConfig } from 'swr';
import type { NotificationDto } from '@fleeted/shared';

const TYPE_LABELS: Record<string, string> = {
  'ride:new': 'New request',
  'offer:accepted': 'Offer accepted',
  'ride:confirmed': 'Confirmed',
  'ride:cancelled': 'Cancelled',
  'ride:started': 'Started',
  'ride:completed': 'Completed',
};

export function NotificationsDrawer() {
  const [open, setOpen] = useState(false);
  const { session } = useAuth();
  const { data: notifications, isLoading } = useNotifications();
  const { mutate } = useSWRConfig();
  const token = session?.token;

  const unread = (notifications ?? []).filter((n) => !n.read);

  async function markRead(ids: string[]) {
    if (token === undefined || ids.length === 0) return;
    await api.post('/api/notifications/read', { ids }, token);
    await mutate(SWR_KEYS.notifications);
  }

  return (
    <>
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen(true)}
        className="relative rounded-lg border border-zinc-800 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white"
      >
        Notifications
        {unread.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[11px] font-semibold text-zinc-950">
            {unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            aria-hidden
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <aside className="relative flex h-full w-full max-w-md flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl">
            <header className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
              <h2 className="text-sm font-semibold tracking-wide text-zinc-200 uppercase">
                Notifications
              </h2>
              <div className="flex items-center gap-3">
                {unread.length > 0 && (
                  <button
                    type="button"
                    onClick={() => void markRead(unread.map((n) => n.id))}
                    className="text-xs text-amber-400 hover:text-amber-300"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setOpen(false)}
                  className="text-zinc-500 hover:text-zinc-200"
                >
                  ×
                </button>
              </div>
            </header>
            <div className="no-scrollbar flex-1 overflow-y-auto p-4">
              {isLoading ? (
                <p className="py-8 text-center text-sm text-zinc-500">Loading…</p>
              ) : (notifications ?? []).length === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-500">No notifications yet</p>
              ) : (
                <ul className="space-y-2">
                  {(notifications ?? []).map((n) => (
                    <NotificationRow
                      key={n.id}
                      notification={n}
                      onRead={() => void markRead([n.id])}
                    />
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function NotificationRow({
  notification,
  onRead,
}: {
  notification: NotificationDto;
  onRead: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={notification.read ? undefined : onRead}
        className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
          notification.read
            ? 'border-zinc-800/60 bg-zinc-900/40 opacity-70'
            : 'border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40'
        }`}
      >
        <span
          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.read ? 'bg-zinc-700' : 'bg-amber-400'}`}
        />
        <span className="min-w-0 flex-1">
          <span className="block text-sm text-zinc-100">{notification.message}</span>
          <span className="mt-0.5 block text-xs text-zinc-500">
            {TYPE_LABELS[notification.type] ?? notification.type} ·{' '}
            {timeAgo(notification.createdAt)}
          </span>
        </span>
      </button>
    </li>
  );
}
