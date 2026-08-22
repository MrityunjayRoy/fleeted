'use client';

import { useState } from 'react';
import { useSWRConfig } from 'swr';
import type { RideOfferDto } from '@fleeted/shared';

import { api, ApiError } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { formatInr } from '../../lib/format';
import { SWR_KEYS, useVendorFleet } from '../../lib/swr-hooks';
import { useToast } from '../../lib/toast';
import { Button, Spinner } from '../ui';

export function AcceptOfferModal({
  offer,
  onClose,
  onAccepted,
}: {
  offer: RideOfferDto;
  onClose: () => void;
  onAccepted: () => void;
}) {
  const { session } = useAuth();
  const { toast } = useToast();
  const { mutate } = useSWRConfig();
  const { data: fleet, isLoading } = useVendorFleet(session?.vendorId);

  const [carId, setCarId] = useState<string | null>(null);
  const [chauffeurId, setChauffeurId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modelId = offer.ride?.model.id;
  const cars = (fleet?.cars ?? []).filter(
    (car) => car.isAvailable && (modelId === undefined || car.modelId === modelId),
  );
  const chauffeurs = (fleet?.chauffeurs ?? []).filter((c) => c.status === 'AVAILABLE');

  async function submit() {
    if (session === null || carId === null || chauffeurId === null) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.post(
        `/api/offers/${offer.id}/accept`,
        { vendorCarId: carId, chauffeurId },
        session.token,
      );
      await mutate(SWR_KEYS.vendorOffers(offer.vendorId));
      await mutate(SWR_KEYS.vendorFleet(offer.vendorId));
      onAccepted();
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Accept failed';
      setError(message);
      toast({ kind: 'error', message });
      await mutate(SWR_KEYS.vendorFleet(offer.vendorId));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div aria-hidden className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-zinc-800 px-5 py-4">
          <div>
            <h3 className="font-medium text-zinc-100">Assign car &amp; chauffeur</h3>
            <p className="mt-0.5 text-xs text-zinc-500">
              {offer.ride?.model.name} · {formatInr(offer.ride?.price ?? 0)}
            </p>
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

        <div className="flex-1 overflow-y-auto space-y-5 px-5 py-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <>
              <PickerGroup label="Available cars for this model">
                {cars.length === 0 ? (
                  <p className="text-sm text-zinc-500">
                    No available cars for this model right now.
                  </p>
                ) : (
                  cars.map((car) => (
                    <PickOption
                      key={car.id}
                      selected={carId === car.id}
                      onSelect={() => setCarId(car.id)}
                      title={`${car.modelId === modelId ? (offer.ride?.model.name ?? '') : ''} ${car.plateNumber}`.trim()}
                      subtitle={formatInr(offer.ride?.model.basePrice ?? 0)}
                    />
                  ))
                )}
              </PickerGroup>

              <PickerGroup label="Available chauffeurs">
                {chauffeurs.length === 0 ? (
                  <p className="text-sm text-zinc-500">No AVAILABLE chauffeurs right now.</p>
                ) : (
                  chauffeurs.map((chauffeur) => (
                    <PickOption
                      key={chauffeur.id}
                      selected={chauffeurId === chauffeur.id}
                      onSelect={() => setChauffeurId(chauffeur.id)}
                      title={chauffeur.name}
                      subtitle={chauffeur.phone}
                    />
                  ))
                )}
              </PickerGroup>
            </>
          )}
          {error !== null && <p className="text-sm text-red-400">{error}</p>}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-zinc-800 px-5 py-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={carId === null || chauffeurId === null}
            loading={submitting}
            onClick={() => void submit()}
          >
            Accept offer
          </Button>
        </footer>
      </div>
    </div>
  );
}

function PickerGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold tracking-wide text-zinc-400 uppercase">{label}</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function PickOption({
  selected,
  onSelect,
  title,
  subtitle,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-lg border px-3 py-2 text-left transition-colors ${
        selected ? 'border-amber-500/60 bg-amber-500/10' : 'border-zinc-800 hover:border-zinc-600'
      }`}
    >
      <p className="text-sm font-medium text-zinc-200">{title}</p>
      <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>
    </button>
  );
}
