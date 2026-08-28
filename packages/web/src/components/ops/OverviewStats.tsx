'use client';

import type { RideDto } from '@fleeted/shared';

function isToday(iso?: string): boolean {
  if (iso === undefined) return false;
  const date = new Date(iso);
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

const CARD_STYLES: Record<string, string> = {
  amber: 'border-amber-500/20 bg-amber-500/5',
  sky: 'border-sky-500/20 bg-sky-500/5',
  emerald: 'border-emerald-500/20 bg-emerald-500/5',
  violet: 'border-violet-500/20 bg-violet-500/5',
  red: 'border-red-500/20 bg-red-500/5',
};

export function OverviewStats({ rides }: { rides: RideDto[] }) {
  const stats = [
    {
      label: 'Matching',
      value: rides.filter((r) => r.status === 'MATCHING').length,
      tone: 'amber',
    },
    {
      label: 'Pending offers',
      value: rides.reduce(
        (acc, ride) => acc + (ride.offers ?? []).filter((o) => o.status === 'PENDING').length,
        0,
      ),
      tone: 'sky',
    },
    {
      label: 'Confirmed today',
      value: rides.filter((r) => r.status === 'CONFIRMED' && isToday(r.confirmedAt)).length,
      tone: 'emerald',
    },
    {
      label: 'Completed',
      value: rides.filter((r) => r.status === 'COMPLETED').length,
      tone: 'violet',
    },
    {
      label: 'Cancelled',
      value: rides.filter((r) => r.status === 'CANCELLED').length,
      tone: 'red',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {stats.map((stat) => (
        <div key={stat.label} className={`rounded-xl border p-4 ${CARD_STYLES[stat.tone] ?? ''}`}>
          <p className="text-2xl font-semibold text-zinc-100">{stat.value}</p>
          <p className="mt-0.5 text-xs text-zinc-500">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
