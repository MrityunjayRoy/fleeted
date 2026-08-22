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

  function handleLogout() {
    logout();
    router.replace('/login');
  }

  return (
    <RequireAuth>
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-zinc-800/80 bg-zinc-900/50">
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
                onClick={handleLogout}
                className="flex-1 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-red-500 hover:text-red-300"
              >
                Log out
              </button>
            </div>
          </div>
        </aside>
        <div className="ml-64 flex min-h-screen flex-col">
          <header className="sticky top-0 z-30 flex items-center justify-end gap-3 border-b border-zinc-800/80 bg-zinc-950/90 px-6 py-3 backdrop-blur">
            <NotificationsDrawer />
          </header>
          <main className="flex-1 p-8">{children}</main>
        </div>
      </div>
    </RequireAuth>
  );
}
