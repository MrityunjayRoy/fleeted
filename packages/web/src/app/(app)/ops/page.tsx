'use client';

import { EmptyState, SectionHeader } from '../../../components/ui';

export default function OpsDashboardPage() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Ops Dashboard" subtitle="Approve offers and supervise the network" />
      <EmptyState
        title="Coming in Phase 11"
        description="Offer review, approval and ride supervision will land here."
      />
    </div>
  );
}
