'use client';

import { useState } from 'react';
import type { RideOfferDto } from '@fleeted/shared';

import { OfferCard } from '../../../components/vendor/OfferCard';
import { FleetPanel } from '../../../components/vendor/FleetPanel';
import { CenteredSpinner, EmptyState, SectionHeader } from '../../../components/ui';
import { useAuth } from '../../../lib/auth';
import { useVendorOffers } from '../../../lib/swr-hooks';

type Tab = 'requests' | 'history' | 'fleet';

const TERMINAL_RIDE = new Set(['COMPLETED', 'CANCELLED']);

function isLive(offer: RideOfferDto): boolean {
  if (offer.status === 'PENDING') return true;
  if (
    offer.status === 'ACCEPTED' &&
    offer.ride !== undefined &&
    !TERMINAL_RIDE.has(offer.ride.status)
  ) {
    return true;
  }
  return false;
}

export default function VendorDashboardPage() {
  const [tab, setTab] = useState<Tab>('requests');
  const { session } = useAuth();
  const { data: offers, isLoading } = useVendorOffers(session?.vendorId);

  const all = offers ?? [];
  const live = all
    .filter(isLive)
    .sort((a, b) => Number(b.status === 'PENDING') - Number(a.status === 'PENDING'));
  const history = all.filter((offer) => !isLive(offer));
  const pendingCount = all.filter((offer) => offer.status === 'PENDING').length;

  const tabs: Array<{ id: Tab; label: string; badge?: number }> = [
    { id: 'requests', label: 'Ride requests', badge: pendingCount },
    { id: 'history', label: 'History', badge: history.length },
    { id: 'fleet', label: 'Fleet' },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Vendor Dashboard"
        subtitle="Accept ride requests, manage availability and track your offers."
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

      {tab === 'fleet' ? (
        <FleetPanel />
      ) : isLoading ? (
        <CenteredSpinner />
      ) : tab === 'requests' ? (
        live.length === 0 ? (
          <EmptyState
            title="No open ride requests"
            description="New requests for models in your fleet appear here instantly."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {live.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        )
      ) : history.length === 0 ? (
        <EmptyState
          title="No past offers yet"
          description="Accepted and closed offers show up here."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {history.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      )}
    </div>
  );
}
