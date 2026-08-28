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

export function DriverRideCard({ ride }: { ride: RideDto }) {
  const { session } = useAuth();
  const { toast } = useToast();
  const { mutate } = useSWRConfig();
  const [busy, setBusy] = useState<'start' | 'complete' | null>(null);
  const [confirmingStart, setConfirmingStart] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = session?.token;

  const assignment = ride.assignment;

  async function run(action: 'start' | 'complete') {
    if (token === undefined) return;
    setBusy(action);
    setError(null);
    try {
      await api.post(`/api/driver/rides/${ride.id}/${action}`, undefined, token);
      await mutate(SWR_KEYS.myRides);
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Request failed';
      setError(message);
      toast({ kind: 'error', message });
    } finally {
      setBusy(null);
      setConfirmingStart(false);
    }
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-zinc-100">{ride.model.name}</p>
          <div className="mt-1 flex items-center gap-2">
            <StatusBadge status={ride.status} />
            <span className="text-xs text-zinc-500">{formatDateTime(ride.pickupTime)}</span>
          </div>
        </div>
        <p className="shrink-0 text-right text-sm text-zinc-200">{formatInr(ride.price)}</p>
      </div>

      <div className="mt-3 rounded-lg border border-zinc-800 px-3 py-2.5 text-sm">
        <p className="text-zinc-200">
          <span className="text-zinc-500">Pickup </span>
          {ride.pickup}
        </p>
        <p className="mt-0.5 text-zinc-200">
          <span className="text-zinc-500">Dropoff </span>
          {ride.dropoff}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-1.5 text-xs sm:grid-cols-2">
        <p className="text-zinc-500">
          Customer{' '}
          <span className="text-zinc-200">
            {ride.customer.name} · {ride.customer.phone}
          </span>
        </p>
        {assignment !== undefined && (
          <>
            <p className="text-zinc-500">
              Car{' '}
              <span className="text-zinc-200">
                {assignment.car.plateNumber} · {ride.model.name}
              </span>
            </p>
            <p className="text-zinc-500">
              Vendor{' '}
              <span className="text-zinc-200">
                {assignment.vendor.name}
                {assignment.vendor.isCompany && ' (company fleet)'}
                {' · '}
                {assignment.vendor.phone}
              </span>
            </p>
          </>
        )}
      </div>

      {error !== null && (
        <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </p>
      )}

      {ride.status === 'CONFIRMED' && !confirmingStart && (
        <div className="mt-3 flex justify-end border-t border-zinc-800 pt-3">
          <Button loading={busy === 'start'} onClick={() => setConfirmingStart(true)}>
            Start ride
          </Button>
        </div>
      )}
      {ride.status === 'CONFIRMED' && confirmingStart && (
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-zinc-800 pt-3">
          <p className="text-sm text-zinc-400">This locks the car and chauffeur for the journey.</p>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => setConfirmingStart(false)}
              disabled={busy !== null}
            >
              Keep
            </Button>
            <Button loading={busy === 'start'} onClick={() => void run('start')}>
              Confirm start
            </Button>
          </div>
        </div>
      )}
      {ride.status === 'STARTED' && (
        <div className="mt-3 flex justify-end border-t border-zinc-800 pt-3">
          <Button
            variant="secondary"
            loading={busy === 'complete'}
            onClick={() => void run('complete')}
          >
            Complete ride
          </Button>
        </div>
      )}
    </Card>
  );
}
