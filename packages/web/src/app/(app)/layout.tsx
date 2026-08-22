'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import type { Role } from '@fleeted/shared';

import { DASHBOARD_PATHS, useAuth } from '../../lib/auth';
import { useSocket } from '../../lib/useSocket';
import { RequireAuth } from '../../components/RequireAuth';
import { NotificationsDrawer } from '../../components/notifications/NotificationsDrawer';

const NAV: Record<Role, Array<{ href: string; label: string }>> = {
  CUSTOMER: [{ href: '/customer', label: 'Book & Track' }],
  VENDOR: [{ href: '/vendor', label: 'Vendor Dashboard' }],
  OPS: [{ href: '/ops', label: 'Ops Dashboard' }],
  DRIVER: [{ href: '/driver', label: 'Driver Dashboard' }],
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { session, logout } = useAuth();
  const router = useRouter();
  useSocket();

  if (!session) return null;

  const nav = NAV[session.role] ?? [];

  return (
    <RequireAuth>
      <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
        <aside className="flex w-64 shrink-0 flex-col border-r border-zinc-800/80 bg-zinc-900/50">
          <div className="px-6 py-5">
            <Link
              href={DASHBOARD_PATHS[session.role] ?? '/'}
              className="text-lg font-semibold tracking-tight"
            >
              Fleeted
              <span className="ml-2 text-xs font-normal text-amber-400">demo</span>
            </Link>
          </div>
          <nav className="flex-1 space-y-1 px-3">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800/60 hover:text-zinc-100"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-zinc-800/80 p-4">
            <p className="text-sm font-medium text-zinc-200">{session.displayName}</p>
            <p className="text-xs text-zinc-500">{session.role}</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="flex-1 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-zinc-500"
              >
                Switch role
              </button>
              <button
                type="button"
                onClick={logout}
                className="flex-1 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-red-500 hover:text-red-300"
              >
                Log out
              </button>
            </div>
          </div>
        </aside>
        <div className="flex min-h-0 flex-1 flex-col">
          <header className="flex items-center justify-end gap-3 border-b border-zinc-800/80 px-6 py-3">
            <NotificationsDrawer />
          </header>
          <main className="flex-1 overflow-y-auto p-8">{children}</main>
        </div>
      </div>
    </RequireAuth>
  );
}
