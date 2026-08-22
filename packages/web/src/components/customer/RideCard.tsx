'use client';

import { useState } from 'react';
import { useSWRConfig } from 'swr';
import type { RideDto } from '@fleeted/shared';

import { api, ApiError } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { formatDateTime, formatInr } from '../../lib/format';
import { SWR_KEYS } from '../../lib/swr-hooks';
import { useToast } from '../../lib/toast';
import { Button, Card, StatusBadge } from '../ui';
import { RideTimeline } from './RideTimeline';

const CANCELLABLE = new Set(['PENDING', 'MATCHING', 'CONFIRMED', 'STARTED']);

export function RideCard({ ride }: { ride: RideDto }) {
  const { session } = useAuth();
  const { toast } = useToast();
  const { mutate } = useSWRConfig();
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  async function cancel() {
    if (session === null) return;
    setCancelling(true);
    try {
      await api.post(`/api/rides/${ride.id}/cancel`, undefined, session.token);
      toast({ message: 'Ride cancelled' });
      setConfirming(false);
      await mutate(SWR_KEYS.myRides);
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Cancellation failed';
      toast({ kind: 'error', message });
    } finally {
      setCancelling(false);
    }
  }

  const base = ride.model.basePrice;

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-zinc-100">{ride.model.name}</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Booked {formatDateTime(ride.createdAt)} · {ride.distanceKm} km
          </p>
        </div>
        <StatusBadge status={ride.status} />
      </div>

      <p className="text-sm text-zinc-300">
        <span className="text-zinc-500">from </span>
        {ride.pickup}
        <span className="text-zinc-500"> to </span>
        {ride.dropoff}
      </p>
      <p className="text-xs text-zinc-500">Pickup {formatDateTime(ride.pickupTime)}</p>

      <RideTimeline status={ride.status} />

      {ride.assignment !== undefined && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-sm">
          <p className="text-emerald-300">{ride.assignment.chauffeur.name}</p>
          <p className="mt-0.5 text-xs text-zinc-400">
            {ride.assignment.vendor.name} · {ride.assignment.car.plateNumber} ·{' '}
            {ride.assignment.chauffeur.phone}
          </p>
        </div>
      )}

      <div className="border-t border-zinc-800 pt-3 text-sm text-zinc-400">
        {formatInr(base)} base + {formatInr(ride.model.pricePerKm)}/km × {ride.distanceKm} km ={' '}
        <span className="font-semibold text-zinc-100">{formatInr(ride.price)}</span>
      </div>

      {(ride.confirmedAt !== undefined ||
        ride.startedAt !== undefined ||
        ride.completedAt !== undefined ||
        ride.cancelledAt !== undefined) && (
        <p className="text-xs text-zinc-600">
          {[
            ride.confirmedAt !== undefined ? `Confirmed ${formatDateTime(ride.confirmedAt)}` : null,
            ride.startedAt !== undefined ? `Started ${formatDateTime(ride.startedAt)}` : null,
            ride.completedAt !== undefined ? `Completed ${formatDateTime(ride.completedAt)}` : null,
            ride.cancelledAt !== undefined ? `Cancelled ${formatDateTime(ride.cancelledAt)}` : null,
          ]
            .filter((part): part is string => part !== null)
            .join(' · ')}
        </p>
      )}

      {CANCELLABLE.has(ride.status) && (
        <div className="flex items-center justify-end gap-2">
          {confirming ? (
            <>
              <span className="mr-auto text-xs text-zinc-500">Cancel this ride?</span>
              <Button variant="ghost" disabled={cancelling} onClick={() => setConfirming(false)}>
                Keep ride
              </Button>
              <Button variant="danger" loading={cancelling} onClick={() => void cancel()}>
                Yes, cancel
              </Button>
            </>
          ) : (
            <Button variant="secondary" onClick={() => setConfirming(true)}>
              Cancel ride
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
