'use client';

import { useCallback } from 'react';
import useSWR from 'swr';
import type {
  CarModelDto,
  NotificationDto,
  RideDto,
  RideOfferDto,
  VendorFleetDto,
} from '@fleeted/shared';

import { api } from './api';
import { useAuth } from './auth';

export const SWR_KEYS = {
  carModels: '/api/car-models',
  myRides: '/api/rides/mine',
  vendorOffers: (vendorId: string) => `/api/vendors/${vendorId}/offers`,
  vendorFleet: (vendorId: string) => `/api/vendors/${vendorId}/cars`,
  opsRides: '/api/ops/rides',
  opsRideDetail: (id: string) => `/api/ops/rides/${id}`,
  notifications: '/api/notifications',
} as const;

function useApiFetcher() {
  const { session } = useAuth();
  const token = session?.token;
  return useCallback(<T>(path: string) => api.get<T>(path, token), [token]);
}

export function useCarModels() {
  const fetcher = useApiFetcher();
  return useSWR<CarModelDto[]>(SWR_KEYS.carModels, () =>
    fetcher<CarModelDto[]>(SWR_KEYS.carModels),
  );
}

export function useMyRides() {
  const fetcher = useApiFetcher();
  return useSWR<RideDto[]>(SWR_KEYS.myRides, () => fetcher<RideDto[]>(SWR_KEYS.myRides));
}

export function useVendorOffers(vendorId: string | undefined) {
  const fetcher = useApiFetcher();
  const key = vendorId !== undefined ? SWR_KEYS.vendorOffers(vendorId) : null;
  return useSWR<RideOfferDto[]>(key, () =>
    fetcher<RideOfferDto[]>(SWR_KEYS.vendorOffers(vendorId ?? '')),
  );
}

export function useVendorFleet(vendorId: string | undefined) {
  const fetcher = useApiFetcher();
  const key = vendorId !== undefined ? SWR_KEYS.vendorFleet(vendorId) : null;
  return useSWR<VendorFleetDto>(key, () =>
    fetcher<VendorFleetDto>(SWR_KEYS.vendorFleet(vendorId ?? '')),
  );
}

export function useOpsRides() {
  const fetcher = useApiFetcher();
  return useSWR<RideDto[]>(SWR_KEYS.opsRides, () => fetcher<RideDto[]>(SWR_KEYS.opsRides));
}

export function useOpsRideDetail(id: string | undefined) {
  const fetcher = useApiFetcher();
  const key = id !== undefined ? SWR_KEYS.opsRideDetail(id) : null;
  return useSWR<RideDto>(key, () => fetcher<RideDto>(SWR_KEYS.opsRideDetail(id ?? '')));
}

export function useNotifications() {
  const fetcher = useApiFetcher();
  return useSWR<NotificationDto[]>(SWR_KEYS.notifications, () =>
    fetcher<NotificationDto[]>(SWR_KEYS.notifications),
  );
}
