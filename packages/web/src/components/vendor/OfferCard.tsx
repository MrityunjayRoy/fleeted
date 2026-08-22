'use client';

import { useState } from 'react';
import { useSWRConfig } from 'swr';
import type { RideOfferDto } from '@fleeted/shared';

import { api, ApiError } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { formatDateTime, formatInr } from '../../lib/format';
import { SWR_KEYS } from '../../lib/swr-hooks';
import { useToast } from '../../lib/toast';
import { Button, Card, StatusBadge } from '../ui';
import { AcceptOfferModal } from './AcceptOfferModal';

export function OfferCard({ offer }: { offer: RideOfferDto }) {
  const { session } = useAuth();
  const { toast } = useToast();
  const { mutate } = useSWRConfig();
  const [accepting, setAccepting] = useState(false);

  const ride = offer.ride;
  const isPending = offer.status === 'PENDING';

  async function handleAccepted() {
    setAccepting(false);
    toast({ kind: 'success', message: 'Offer accepted — awaiting ops approval' });
    await mutate((key) => typeof key === 'string' && key.startsWith('/api/'));
  }

  async function reject() {
    if (session === null) return;
    try {
      await api.post(`/api/offers/${offer.id}/reject`, undefined, session.token);
      toast({ message: 'Offer rejected' });
      await mutate(SWR_KEYS.vendorOffers(offer.vendorId));
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Reject failed';
      toast({ kind: 'error', message });
    }
  }

  const stateLine = stateFor(offer);

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-zinc-100">{ride?.model.name ?? 'Ride request'}</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            {formatDateTime(ride?.pickupTime ?? offer.createdAt)} · {ride?.distanceKm ?? '—'} km
          </p>
        </div>
        <StatusBadge
          status={offer.status === 'ACCEPTED' ? 'ACCEPTED' : (ride?.status ?? offer.status)}
        />
      </div>

      <p className="text-sm text-zinc-300">
        <span className="text-zinc-500">from </span>
        {ride?.pickup}
        <span className="text-zinc-500"> to </span>
        {ride?.dropoff}
      </p>

      {ride !== undefined && (
        <p className="text-sm text-zinc-400">
          {formatInr(ride.model.basePrice)} base + {formatInr(ride.model.pricePerKm)}/km ×{' '}
          {ride.distanceKm} km ={' '}
          <span className="font-semibold text-amber-300">{formatInr(ride.price)}</span>
        </p>
      )}

      {offer.chauffeur !== undefined && offer.vendorCar !== undefined && (
        <p className="text-xs text-emerald-300/80">
          Assigned: {offer.chauffeur.name} · {offer.vendorCar.plateNumber}
        </p>
      )}

      {stateLine !== null && <p className="text-xs text-zinc-500">{stateLine}</p>}

      {isPending && (
        <div className="flex items-center justify-end gap-2 border-t border-zinc-800 pt-3">
          <Button variant="ghost" onClick={() => void reject()}>
            Reject
          </Button>
          <Button onClick={() => setAccepting(true)}>Accept request</Button>
        </div>
      )}

      {accepting && (
        <AcceptOfferModal
          offer={offer}
          onClose={() => setAccepting(false)}
          onAccepted={() => void handleAccepted()}
        />
      )}
    </Card>
  );
}

function stateFor(offer: RideOfferDto): string | null {
  if (offer.status === 'PENDING') return null;
  if (offer.status === 'REJECTED') return 'You rejected this request.';
  if (offer.status === 'RELEASED') return 'This ride was released after cancellation.';
  if (offer.status === 'ACCEPTED') {
    if (offer.ride?.status === 'CONFIRMED') return 'Your offer was approved — chauffeur assigned.';
    if (offer.ride?.status === 'STARTED') return 'Ride in progress.';
    if (offer.ride?.status === 'COMPLETED') return 'Ride completed.';
    if (offer.ride?.status === 'CANCELLED') return 'The customer cancelled this ride.';
    return 'Awaiting ops approval…';
  }
  return null;
}
