'use client';

import { useMemo, useState } from 'react';
import type { RideDto, RideStatus } from '@fleeted/shared';

import { formatDateTime, formatInr } from '../../lib/format';
import { EmptyState, StatusBadge } from '../ui';

const STATUS_FILTERS: Array<{ id: RideStatus | 'ALL'; label: string }> = [
  { id: 'ALL', label: 'All' },
  { id: 'MATCHING', label: 'Matching' },
  { id: 'CONFIRMED', label: 'Confirmed' },
  { id: 'STARTED', label: 'Started' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'CANCELLED', label: 'Cancelled' },
];

function idLabel(id: string): string {
  return id.slice(-8).toUpperCase();
}

export function RidesTable({
  rides,
  onSelect,
}: {
  rides: RideDto[];
  onSelect: (ride: RideDto) => void;
}) {
  const [status, setStatus] = useState<RideStatus | 'ALL'>('ALL');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    let list = rides;
    if (status !== 'ALL') list = list.filter((r) => r.status === status);
    if (term !== '') {
      list = list.filter((r) => {
        const vendorMatch = (r.offers ?? []).some((o) =>
          o.vendor.name.toLowerCase().includes(term),
        );
        return (
          vendorMatch ||
          r.model.name.toLowerCase().includes(term) ||
          r.customer.name.toLowerCase().includes(term)
        );
      });
    }
    return list;
  }, [rides, status, query]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setStatus(filter.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                status === filter.id
                  ? 'bg-amber-500 text-zinc-950'
                  : 'border border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search customer, vendor or model…"
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none sm:w-72"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No rides to show"
          description="Adjust the status filter or search term, or wait for the next booking."
        />
      ) : (
        <div className="no-scrollbar overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900/60 text-xs tracking-wide text-zinc-500 uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Ride</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Route</th>
                <th className="px-4 py-3 font-medium">Pickup time</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Offers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70">
              {filtered.map((ride) => (
                <tr
                  key={ride.id}
                  onClick={() => onSelect(ride)}
                  className="cursor-pointer transition-colors hover:bg-zinc-900/60"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-200">{idLabel(ride.id)}</p>
                    <p className="text-xs text-zinc-500">{ride.model.name}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-zinc-200">{ride.customer.name}</p>
                    <p className="text-xs text-zinc-500">{ride.customer.phone}</p>
                  </td>
                  <td className="max-w-[220px] px-4 py-3">
                    <p className="truncate text-zinc-200">{ride.pickup}</p>
                    <p className="truncate text-xs text-zinc-500">→ {ride.dropoff}</p>
                  </td>
                  <td className="px-4 py-3 text-zinc-300">{formatDateTime(ride.pickupTime)}</td>
                  <td className="px-4 py-3 text-zinc-200">{formatInr(ride.price)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={ride.status} />
                  </td>
                  <td className="px-4 py-3 text-zinc-300">{(ride.offers ?? []).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
