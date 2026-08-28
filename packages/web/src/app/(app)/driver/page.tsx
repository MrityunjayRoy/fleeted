'use client';

import { useMemo, useState } from 'react';

import { DriverRideCard } from '../../../components/driver/RideCard';
import { CenteredSpinner, EmptyState, SectionHeader } from '../../../components/ui';
import { useMyRides } from '../../../lib/swr-hooks';

type Tab = 'schedule' | 'history';

function isToday(iso: string): boolean {
  const date = new Date(iso);
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

export default function DriverDashboardPage() {
  const [tab, setTab] = useState<Tab>('schedule');
  const { data: rides, isLoading, error } = useMyRides();

  const sorted = useMemo(
    () =>
      [...(rides ?? [])].sort(
        (a, b) => new Date(a.pickupTime).getTime() - new Date(b.pickupTime).getTime(),
      ),
    [rides],
  );

  const schedule = sorted.filter((r) => r.status === 'CONFIRMED' || r.status === 'STARTED');
  const history = sorted.filter((r) => r.status === 'COMPLETED' || r.status === 'CANCELLED');
  const today = schedule.filter((r) => isToday(r.pickupTime));
  const upcoming = schedule.filter((r) => !isToday(r.pickupTime));

  const tabs: Array<{ id: Tab; label: string; badge?: number }> = [
    { id: 'schedule', label: 'My schedule', badge: schedule.length },
    { id: 'history', label: 'History', badge: history.length },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Driver Dashboard"
        subtitle="Assigned rides show up here the moment ops approves an offer. Start and complete each ride to update the network."
      />

      <div className="flex gap-1 border-b border-zinc-800">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
              tab === t.id
                ? 'border-b-2 border-amber-500 font-medium text-zinc-100'
                : 'border-b-2 border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {t.label}
            {t.badge !== undefined && t.badge > 0 && (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-300">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <CenteredSpinner />
      ) : error !== undefined ? (
        <EmptyState title="Could not load your schedule" />
      ) : tab === 'schedule' ? (
        schedule.length === 0 ? (
          <EmptyState
            title="No rides assigned yet"
            description="When ops approves an offer for your car and chauffeur, it appears here instantly."
          />
        ) : (
          <div className="space-y-8">
            {today.length > 0 && (
              <section>
                <h2 className="mb-3 text-xs font-semibold tracking-wide text-zinc-400 uppercase">
                  Today
                </h2>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {today.map((ride) => (
                    <DriverRideCard key={ride.id} ride={ride} />
                  ))}
                </div>
              </section>
            )}
            {upcoming.length > 0 && (
              <section>
                <h2 className="mb-3 text-xs font-semibold tracking-wide text-zinc-400 uppercase">
                  Upcoming
                </h2>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {upcoming.map((ride) => (
                    <DriverRideCard key={ride.id} ride={ride} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )
      ) : history.length === 0 ? (
        <EmptyState
          title="No past rides yet"
          description="Completed and cancelled rides appear here."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {history.map((ride) => (
            <DriverRideCard key={ride.id} ride={ride} />
          ))}
        </div>
      )}
    </div>
  );
}
