'use client';

import { useMemo, useState } from 'react';
import { useSWRConfig } from 'swr';
import type { CarModelDto } from '@fleeted/shared';

import { api, ApiError } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { formatInr } from '../../lib/format';
import { SWR_KEYS } from '../../lib/swr-hooks';
import { useToast } from '../../lib/toast';
import { Button } from '../ui';

const inputClass =
  'w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500/60 focus:outline-none';

export function BookingForm({ model }: { model: CarModelDto | null }) {
  const { session } = useAuth();
  const { toast } = useToast();
  const { mutate } = useSWRConfig();

  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [distanceKm, setDistanceKm] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const minTime = useMemo(() => new Date(Date.now() + 60_000).toISOString().slice(0, 16), []);

  const distance = Number(distanceKm);
  const validDistance = Number.isFinite(distance) && distance > 0;
  const estimate =
    model !== null && validDistance ? model.basePrice + model.pricePerKm * distance : null;
  const futureTime = pickupTime !== '' && new Date(pickupTime).getTime() > Date.now();

  const canSubmit =
    model !== null &&
    pickup.trim() !== '' &&
    dropoff.trim() !== '' &&
    futureTime &&
    validDistance &&
    !submitting;

  async function submit() {
    if (model === null || !canSubmit || session === null) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.post(
        '/api/rides',
        {
          modelId: model.id,
          pickup: pickup.trim(),
          dropoff: dropoff.trim(),
          pickupTime: new Date(pickupTime).toISOString(),
          distanceKm: distance,
          ...(notes.trim() !== '' ? { notes: notes.trim() } : {}),
        },
        session.token,
      );
      toast({ kind: 'success', message: `Ride booked — waiting for vendor offers` });
      setPickup('');
      setDropoff('');
      setPickupTime('');
      setDistanceKm('');
      setNotes('');
      await mutate(SWR_KEYS.myRides);
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Booking failed';
      setError(message);
      toast({ kind: 'error', message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
      <h3 className="text-sm font-semibold tracking-wide text-zinc-200 uppercase">Book a ride</h3>
      {model === null ? (
        <p className="mt-4 text-sm text-zinc-500">Select a car from the catalog to continue.</p>
      ) : (
        <div className="mt-4 space-y-3">
          <p className="text-sm">
            <span className="font-medium text-amber-300">{model.name}</span>
            <span className="text-zinc-500">
              {' '}
              · {formatInr(model.basePrice)} + {formatInr(model.pricePerKm)}/km
            </span>
          </p>
          <input
            className={inputClass}
            placeholder="Pickup location"
            value={pickup}
            onChange={(e) => setPickup(e.target.value)}
          />
          <input
            className={inputClass}
            placeholder="Dropoff location"
            value={dropoff}
            onChange={(e) => setDropoff(e.target.value)}
          />
          <input
            className={inputClass}
            type="datetime-local"
            min={minTime}
            value={pickupTime}
            onChange={(e) => setPickupTime(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <input
              className={inputClass}
              type="number"
              min="1"
              step="1"
              placeholder="Distance (km)"
              value={distanceKm}
              onChange={(e) => setDistanceKm(e.target.value)}
            />
          </div>
          <textarea
            className={`${inputClass} h-20 resize-none`}
            placeholder="Notes for the chauffeur (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
            <span className="text-sm text-zinc-500">
              {estimate !== null
                ? `Estimated total ${formatInr(estimate)}`
                : 'Enter details for an estimate'}
            </span>
          </div>
          {error !== null && <p className="text-sm text-red-400">{error}</p>}
          <Button
            className="w-full"
            loading={submitting}
            disabled={!canSubmit}
            onClick={() => void submit()}
          >
            Book ride
          </Button>
          {pickupTime !== '' && !futureTime && (
            <p className="text-xs text-amber-400/80">Pickup time must be in the future.</p>
          )}
        </div>
      )}
    </div>
  );
}
