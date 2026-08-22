'use client';

import { EmptyState, SectionHeader } from '../../../components/ui';

export default function VendorDashboardPage() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Vendor Dashboard" subtitle="Manage ride requests and your fleet" />
      <EmptyState
        title="Coming in Phase 10"
        description="Ride request queue, offer acceptance and fleet management will land here."
      />
    </div>
  );
}
