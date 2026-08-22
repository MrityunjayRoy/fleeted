'use client';

import type { RideStatus } from '@fleeted/shared';

const STEPS = ['Booked', 'Offer', 'Confirmed', 'Started', 'Completed'] as const;

function currentStep(status: RideStatus): number {
  switch (status) {
    case 'PENDING':
    case 'MATCHING':
      return 1;
    case 'CONFIRMED':
      return 2;
    case 'STARTED':
      return 3;
    case 'COMPLETED':
      return 4;
    case 'CANCELLED':
      return -1;
  }
}

export function RideTimeline({ status }: { status: RideStatus }) {
  const active = currentStep(status);
  const cancelled = status === 'CANCELLED';

  if (cancelled) {
    return (
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-red-400" />
        <span className="text-xs text-red-300">Ride cancelled</span>
      </div>
    );
  }

  return (
    <ol className="flex items-center gap-1.5">
      {STEPS.map((step, i) => {
        const done = i <= active;
        const current = i === active && i > 0;
        return (
          <li key={step} className="flex items-center gap-1.5">
            {i > 0 && (
              <span className={`h-px w-4 ${i <= active ? 'bg-amber-500/60' : 'bg-zinc-700'}`} />
            )}
            <span
              title={step}
              className={`rounded-full px-2 py-0.5 text-[11px] whitespace-nowrap ${
                current
                  ? 'bg-amber-500/15 font-medium text-amber-300'
                  : done
                    ? 'text-zinc-400'
                    : 'text-zinc-600'
              }`}
            >
              {step}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
