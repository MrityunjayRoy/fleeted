import { z } from 'zod';

import { RoleSchema } from './enums.js';

export const LoginRequestSchema = z
  .object({
    role: RoleSchema,
    name: z.string().trim().min(1).max(120),
  })
  .strict();
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const CreateRideRequestSchema = z
  .object({
    modelId: z.string().trim().min(1),
    pickup: z.string().trim().min(1).max(255),
    dropoff: z.string().trim().min(1).max(255),
    pickupTime: z.iso.datetime(),
    distanceKm: z.number().positive().max(5000),
    notes: z.string().trim().max(1000).optional(),
  })
  .strict();
export type CreateRideRequest = z.infer<typeof CreateRideRequestSchema>;

export const AcceptOfferRequestSchema = z
  .object({
    vendorCarId: z.string().trim().min(1),
    chauffeurId: z.string().trim().min(1),
  })
  .strict();
export type AcceptOfferRequest = z.infer<typeof AcceptOfferRequestSchema>;

export const AvailabilityToggleRequestSchema = z
  .object({
    isAvailable: z.boolean(),
  })
  .strict();
export type AvailabilityToggleRequest = z.infer<typeof AvailabilityToggleRequestSchema>;

export const MarkReadRequestSchema = z
  .object({
    ids: z.array(z.string().min(1)).min(1),
  })
  .strict();
export type MarkReadRequest = z.infer<typeof MarkReadRequestSchema>;
