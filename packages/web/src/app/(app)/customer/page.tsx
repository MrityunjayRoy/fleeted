'use client';

import { EmptyState, SectionHeader } from '../../components/ui';

export default function CustomerDashboardPage() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Customer Dashboard" subtitle="Book & track luxury rides" />
      <EmptyState
        title="Coming in Phase 9"
        description="Ride booking, pricing and live tracking will land here."
      />
    </div>
  );
}
