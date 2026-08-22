'use client';

import { useState } from 'react';
import type { CarModelDto } from '@fleeted/shared';

import { CatalogGrid } from '../../../components/customer/CatalogGrid';
import { BookingForm } from '../../../components/customer/BookingForm';
import { RideCard } from '../../../components/customer/RideCard';
import { CenteredSpinner, EmptyState, SectionHeader } from '../../../components/ui';
import { useMyRides, useCarModels } from '../../../lib/swr-hooks';

export default function CustomerDashboardPage() {
  const { data: models, isLoading: modelsLoading } = useCarModels();
  const { data: rides, isLoading: ridesLoading } = useMyRides();
  const [selected, setSelected] = useState<CarModelDto | null>(null);

  return (
    <div className="space-y-10">
      <SectionHeader
        title="Book & Track"
        subtitle="Browse the fleet, book a ride and follow it live."
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-wide text-zinc-400 uppercase">
            Fleet catalog
          </h2>
          {modelsLoading ? (
            <CenteredSpinner />
          ) : (
            <CatalogGrid
              models={models ?? []}
              selectedId={selected?.id ?? null}
              onSelect={setSelected}
            />
          )}
        </section>
        <aside className="xl:sticky xl:top-8">
          <BookingForm model={selected} />
        </aside>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wide text-zinc-400 uppercase">My rides</h2>
        {ridesLoading ? (
          <CenteredSpinner />
        ) : (rides ?? []).length === 0 ? (
          <EmptyState
            title="No rides yet"
            description="Pick a car above and book your first ride."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {(rides ?? []).map((ride) => (
              <RideCard key={ride.id} ride={ride} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
