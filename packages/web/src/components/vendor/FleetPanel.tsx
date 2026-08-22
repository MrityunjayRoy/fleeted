'use client';

import { useSWRConfig } from 'swr';
import type { ChauffeurDto, VendorCarDto } from '@fleeted/shared';

import { api, ApiError } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { SWR_KEYS, useVendorFleet } from '../../lib/swr-hooks';
import { useToast } from '../../lib/toast';
import { Button, Card, CenteredSpinner, EmptyState, StatusBadge } from '../ui';

export function FleetPanel() {
  const { session } = useAuth();
  const vendorId = session?.vendorId;
  const { data: fleet, isLoading } = useVendorFleet(vendorId);
  const { toast } = useToast();
  const { mutate } = useSWRConfig();

  async function toggleAvailability(car: VendorCarDto) {
    const token = session?.token;
    if (vendorId === undefined || token === undefined) return;
    try {
      await api.post(
        `/api/vendors/${vendorId}/cars/${car.id}/availability`,
        { isAvailable: !car.isAvailable },
        token,
      );
      await mutate(SWR_KEYS.vendorFleet(vendorId));
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Toggle failed';
      toast({ kind: 'error', message });
    }
  }

  if (isLoading) return <CenteredSpinner />;
  if (fleet === undefined) return <EmptyState title="Fleet unavailable" />;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <h3 className="mb-3 text-xs font-semibold tracking-wide text-zinc-400 uppercase">Cars</h3>
        <ul className="space-y-2">
          {fleet.cars.map((car) => (
            <li
              key={car.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-zinc-200">{car.plateNumber}</p>
                <p className="text-xs text-zinc-500">
                  {car.modelId.replace('model-', '').replaceAll('-', ' ')}
                </p>
              </div>
              <Button
                variant={car.isAvailable ? 'secondary' : 'ghost'}
                onClick={() => void toggleAvailability(car)}
              >
                {car.isAvailable ? 'Available' : 'Unavailable'}
              </Button>
            </li>
          ))}
          {fleet.cars.length === 0 && (
            <li>
              <EmptyState title="No cars in fleet" />
            </li>
          )}
        </ul>
      </Card>

      <Card>
        <h3 className="mb-3 text-xs font-semibold tracking-wide text-zinc-400 uppercase">
          Chauffeurs
        </h3>
        <ul className="space-y-2">
          {fleet.chauffeurs.map((chauffeur) => (
            <ChauffeurRow key={chauffeur.id} chauffeur={chauffeur} />
          ))}
          {fleet.chauffeurs.length === 0 && (
            <li>
              <EmptyState title="No chauffeurs in fleet" />
            </li>
          )}
        </ul>
      </Card>
    </div>
  );
}

function ChauffeurRow({ chauffeur }: { chauffeur: ChauffeurDto }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 px-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm text-zinc-200">{chauffeur.name}</p>
        <p className="text-xs text-zinc-500">{chauffeur.phone}</p>
      </div>
      <StatusBadge status={chauffeur.status} />
    </li>
  );
}
