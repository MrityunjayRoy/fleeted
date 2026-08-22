'use client';

import { EmptyState, SectionHeader } from '../../../components/ui';

export default function DriverDashboardPage() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Driver Dashboard" subtitle="See assignments and update ride status" />
      <EmptyState
        title="Coming in Phase 12"
        description="Assigned rides and status updates will land here."
      />
    </div>
  );
}
