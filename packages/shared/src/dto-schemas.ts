import { z } from 'zod';

import {
  CarCategorySchema,
  ChauffeurStatusSchema,
  NotificationTypeSchema,
  OfferStatusSchema,
  RideStatusSchema,
  RoleSchema,
} from './enums.js';

const isoDateTime = z.iso.datetime();

export const HealthResponseSchema = z.object({
  ok: z.literal(true),
});
export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export const CarModelDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: CarCategorySchema,
  basePrice: z.number().positive(),
  pricePerKm: z.number().positive(),
  capacity: z.number().int().positive(),
  description: z.string(),
});
export type CarModelDto = z.infer<typeof CarModelDtoSchema>;

export const VendorDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  isCompany: z.boolean(),
});
export type VendorDto = z.infer<typeof VendorDtoSchema>;

export const ChauffeurDtoSchema = z.object({
  id: z.string(),
  vendorId: z.string(),
  name: z.string(),
  phone: z.string(),
  licenseNumber: z.string(),
  status: ChauffeurStatusSchema,
});
export type ChauffeurDto = z.infer<typeof ChauffeurDtoSchema>;

export const VendorCarDtoSchema = z.object({
  id: z.string(),
  vendorId: z.string(),
  modelId: z.string(),
  plateNumber: z.string(),
  isAvailable: z.boolean(),
});
export type VendorCarDto = z.infer<typeof VendorCarDtoSchema>;

export const CustomerSummaryDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
});
export type CustomerSummaryDto = z.infer<typeof CustomerSummaryDtoSchema>;

export const RideAssignmentDtoSchema = z.object({
  vendor: VendorDtoSchema,
  car: VendorCarDtoSchema,
  chauffeur: ChauffeurDtoSchema,
});
export type RideAssignmentDto = z.infer<typeof RideAssignmentDtoSchema>;

export const RideDtoSchema = z.object({
  id: z.string(),
  status: RideStatusSchema,
  price: z.number().positive(),
  pickup: z.string(),
  dropoff: z.string(),
  pickupTime: isoDateTime,
  distanceKm: z.number().positive(),
  notes: z.string().optional(),
  model: CarModelDtoSchema,
  customer: CustomerSummaryDtoSchema,
  assignment: RideAssignmentDtoSchema.optional(),
  createdAt: isoDateTime,
  confirmedAt: isoDateTime.optional(),
  startedAt: isoDateTime.optional(),
  completedAt: isoDateTime.optional(),
  cancelledAt: isoDateTime.optional(),
});
export type RideDto = z.infer<typeof RideDtoSchema>;

export const RideOfferDtoSchema = z.object({
  id: z.string(),
  rideId: z.string(),
  vendorId: z.string(),
  vendor: VendorDtoSchema,
  ride: z
    .object({
      id: z.string(),
      status: RideStatusSchema,
      model: CarModelDtoSchema,
      pickup: z.string(),
      dropoff: z.string(),
      pickupTime: isoDateTime,
      distanceKm: z.number().positive(),
      price: z.number().positive(),
      notes: z.string().optional(),
    })
    .optional(),
  vendorCar: VendorCarDtoSchema.optional(),
  chauffeur: ChauffeurDtoSchema.optional(),
  status: OfferStatusSchema,
  createdAt: isoDateTime,
  acceptedAt: isoDateTime.optional(),
  rejectedAt: isoDateTime.optional(),
  releasedAt: isoDateTime.optional(),
});
export type RideOfferDto = z.infer<typeof RideOfferDtoSchema>;

export const AuthResponseSchema = z.object({
  token: z.string(),
  role: RoleSchema,
  userId: z.string(),
  displayName: z.string(),
  customerId: z.string().optional(),
  vendorId: z.string().optional(),
  chauffeurId: z.string().optional(),
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const MeResponseSchema = z.object({
  role: RoleSchema,
  userId: z.string(),
  displayName: z.string(),
  customerId: z.string().optional(),
  vendorId: z.string().optional(),
  chauffeurId: z.string().optional(),
});
export type MeResponse = z.infer<typeof MeResponseSchema>;

export const NotificationDtoSchema = z.object({
  id: z.string(),
  recipientRole: RoleSchema,
  recipientId: z.string().nullable(),
  type: NotificationTypeSchema,
  message: z.string(),
  payload: z.record(z.string(), z.unknown()),
  read: z.boolean(),
  createdAt: isoDateTime,
});
export type NotificationDto = z.infer<typeof NotificationDtoSchema>;

export const VendorFleetDtoSchema = z.object({
  cars: z.array(VendorCarDtoSchema),
  chauffeurs: z.array(ChauffeurDtoSchema),
});
export type VendorFleetDto = z.infer<typeof VendorFleetDtoSchema>;

export const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

export const AccountSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
});
export type AccountSummary = z.infer<typeof AccountSummarySchema>;

export const AccountsResponseSchema = z.object({
  accounts: z.array(AccountSummarySchema),
});
export type AccountsResponse = z.infer<typeof AccountsResponseSchema>;

export const AccountsQuerySchema = z.object({
  role: RoleSchema,
});
export type AccountsQuery = z.infer<typeof AccountsQuerySchema>;
