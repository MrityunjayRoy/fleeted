'use client';

import { useMemo, useState } from 'react';

import { OverviewStats } from '../../../components/ops/OverviewStats';
import { RideDetailDrawer } from '../../../components/ops/RideDetailDrawer';
import { RidesTable } from '../../../components/ops/RidesTable';
import { CenteredSpinner, EmptyState, SectionHeader } from '../../../components/ui';
import { useOpsRides } from '../../../lib/swr-hooks';

export default function OpsDashboardPage() {
  const { data: rides, isLoading } = useOpsRides();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const sorted = useMemo(
    () =>
      [...(rides ?? [])].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [rides],
  );

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Ops Console"
        subtitle="Approve offers, supervise rides and cancel when needed — every detail auto-populated."
      />

      {isLoading ? (
        <CenteredSpinner />
      ) : sorted.length === 0 ? (
        <EmptyState
          title="No rides yet"
          description="Bookings appear here the moment a customer places an order."
        />
      ) : (
        <>
          <OverviewStats rides={sorted} />
          <RidesTable rides={sorted} onSelect={(ride) => setSelectedId(ride.id)} />
        </>
      )}

      {selectedId !== null && (
        <RideDetailDrawer rideId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}
