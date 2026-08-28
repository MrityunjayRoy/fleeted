'use client';

import { useState } from 'react';
import { useSWRConfig } from 'swr';
import type { RideDto, RideOfferDto, RideStatus } from '@fleeted/shared';

import { api, ApiError } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { formatDateTime, formatInr } from '../../lib/format';
import { SWR_KEYS, useOpsRideDetail } from '../../lib/swr-hooks';
import { useToast } from '../../lib/toast';
import { Button, Spinner, StatusBadge } from '../ui';

type ConfirmAction = 'approve' | 'cancel' | null;

const CANCELLABLE: RideStatus[] = ['PENDING', 'MATCHING', 'CONFIRMED'];

function idLabel(id: string): string {
  return id.slice(-8).toUpperCase();
}

export function RideDetailDrawer({ rideId, onClose }: { rideId: string; onClose: () => void }) {
  const { session } = useAuth();
  const { toast } = useToast();
  const { mutate } = useSWRConfig();
  const { data: ride, isLoading, error } = useOpsRideDetail(rideId);
  const token = session?.token;

  const [confirm, setConfirm] = useState<ConfirmAction>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const accepted = (ride?.offers ?? []).find((o) => o.status === 'ACCEPTED');
  const canApprove = ride !== undefined && ride.status === 'MATCHING' && accepted !== undefined;
  const canCancel = ride !== undefined && CANCELLABLE.includes(ride.status);

  async function runAction(action: Exclude<ConfirmAction, null>) {
    if (ride === undefined || token === undefined) return;
    setBusy(true);
    setActionError(null);
    try {
      const next: RideDto =
        action === 'approve'
          ? await api.post<RideDto>(`/api/ops/offers/${accepted?.id}/approve`, undefined, token)
          : await api.post<RideDto>(`/api/ops/rides/${ride.id}/cancel`, undefined, token);
      await mutate(SWR_KEYS.opsRideDetail(ride.id), next, { revalidate: false });
      await mutate(SWR_KEYS.opsRides);
      toast({
        kind: action === 'approve' ? 'success' : 'error',
        message:
          action === 'approve'
            ? 'Offer approved — ride confirmed'
            : `Ride ${idLabel(ride.id)} cancelled`,
      });
      setConfirm(null);
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Request failed';
      setActionError(message);
      toast({ kind: 'error', message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div aria-hidden className="absolute inset-0 bg-black/60" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-lg flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl">
        <header className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-zinc-200 uppercase">
              {ride !== undefined ? `Ride ${idLabel(ride.id)}` : 'Ride detail'}
            </h2>
            {ride !== undefined && (
              <div className="mt-1 flex items-center gap-2">
                <StatusBadge status={ride.status} />
                <span className="text-xs text-zinc-500">{ride.model.name}</span>
              </div>
            )}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200"
          >
            ×
          </button>
        </header>

        <div className="no-scrollbar flex-1 overflow-y-auto p-5">
          {isLoading || ride === undefined ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : error !== undefined ? (
            <p className="py-8 text-center text-sm text-red-400">Could not load this ride.</p>
          ) : (
            <div className="space-y-5">
              <InfoCard title="Customer">
                <InfoRow label="Name" value={ride.customer.name} />
                <InfoRow label="Phone" value={ride.customer.phone} />
              </InfoCard>

              <InfoCard title="Ride">
                <InfoRow label="From" value={ride.pickup} />
                <InfoRow label="To" value={ride.dropoff} />
                <InfoRow label="Pickup time" value={formatDateTime(ride.pickupTime)} />
                <InfoRow label="Distance" value={`${ride.distanceKm} km`} />
                <InfoRow label="Price" value={formatInr(ride.price)} />
                <InfoRow label="Booked" value={formatDateTime(ride.createdAt)} />
                {ride.confirmedAt !== undefined && (
                  <InfoRow label="Confirmed" value={formatDateTime(ride.confirmedAt)} />
                )}
                {ride.startedAt !== undefined && (
                  <InfoRow label="Started" value={formatDateTime(ride.startedAt)} />
                )}
                {ride.completedAt !== undefined && (
                  <InfoRow label="Completed" value={formatDateTime(ride.completedAt)} />
                )}
                {ride.cancelledAt !== undefined && (
                  <InfoRow label="Cancelled" value={formatDateTime(ride.cancelledAt)} />
                )}
              </InfoCard>

              <div>
                <h3 className="mb-2 text-xs font-semibold tracking-wide text-zinc-400 uppercase">
                  Vendor offers
                </h3>
                {(ride.offers ?? []).length === 0 ? (
                  <p className="rounded-lg border border-dashed border-zinc-800 py-6 text-center text-sm text-zinc-500">
                    No offers yet — matching is routing this request.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {(ride.offers ?? []).map((offer) => (
                      <li key={offer.id}>
                        <OfferRow
                          offer={offer}
                          rideStatus={ride.status}
                          onApprove={() => setConfirm('approve')}
                          approveDisabled={!canApprove || busy}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {actionError !== null && (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {actionError}
                </p>
              )}

              {canCancel && (
                <div className="border-t border-zinc-800 pt-4">
                  <Button variant="danger" loading={busy} onClick={() => setConfirm('cancel')}>
                    Cancel ride
                  </Button>
                </div>
              )}
            </div>
          )}

          {confirm !== null && (
            <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/70 p-6">
              <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl">
                <h3 className="font-medium text-zinc-100">
                  {confirm === 'approve' ? 'Approve this offer?' : 'Cancel this ride?'}
                </h3>
                <p className="mt-1.5 text-sm text-zinc-500">
                  {confirm === 'approve' ? (
                    <>
                      The ride will be confirmed with this vendor and all other offers will be
                      rejected immediately.
                    </>
                  ) : (
                    <>
                      All pending and accepted offers will be released, and cars and chauffeurs will
                      be freed up.
                    </>
                  )}
                </p>
                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setConfirm(null)} disabled={busy}>
                    Keep
                  </Button>
                  <Button
                    variant={confirm === 'approve' ? 'primary' : 'danger'}
                    loading={busy}
                    onClick={() => void runAction(confirm)}
                  >
                    {confirm === 'approve' ? 'Approve' : 'Cancel ride'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function OfferRow({
  offer,
  rideStatus,
  onApprove,
  approveDisabled,
}: {
  offer: RideOfferDto;
  rideStatus: RideStatus;
  onApprove: () => void;
  approveDisabled: boolean;
}) {
  const approved = offer.status === 'ACCEPTED' && rideStatus === 'CONFIRMED';

  return (
    <div className="rounded-lg border border-zinc-800 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-200">
            {offer.vendor.name}
            {offer.vendor.isCompany && (
              <span className="ml-2 inline-block rounded bg-sky-500/15 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-sky-300 uppercase">
                Company fleet
              </span>
            )}
          </p>
          <p className="mt-1 text-xs text-zinc-500">{formatDateTime(offer.createdAt)}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {approved && (
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
              Approved
            </span>
          )}
          <StatusBadge status={offer.status} />
        </div>
      </div>

      {offer.vendorCar !== undefined && offer.chauffeur !== undefined && (
        <div className="mt-2 grid grid-cols-1 gap-1.5 rounded-md bg-zinc-900/60 p-2.5 text-xs sm:grid-cols-2">
          <p className="text-zinc-400">
            Car:{' '}
            <span className="text-zinc-200">
              {offer.vendorCar.plateNumber} · {offer.ride?.model.name ?? ''}
            </span>
          </p>
          <p className="text-zinc-400">
            Chauffeur:{' '}
            <span className="text-zinc-200">
              {offer.chauffeur.name} · {offer.chauffeur.phone}
            </span>
          </p>
        </div>
      )}

      {offer.status === 'ACCEPTED' && rideStatus === 'MATCHING' && (
        <div className="mt-2.5 flex justify-end">
          <Button className="px-3 py-1.5" onClick={onApprove} disabled={approveDisabled}>
            Approve offer
          </Button>
        </div>
      )}
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold tracking-wide text-zinc-400 uppercase">{title}</h3>
      <div className="divide-y divide-zinc-800/70 rounded-lg border border-zinc-800">
        {children}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-3.5 py-2 text-sm">
      <span className="shrink-0 text-zinc-500">{label}</span>
      <span className="text-right text-zinc-200">{value}</span>
    </div>
  );
}
