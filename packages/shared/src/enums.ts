import { z } from 'zod';

export const ROLES = ['CUSTOMER', 'VENDOR', 'OPS', 'DRIVER'] as const;
export type Role = (typeof ROLES)[number];
export const RoleSchema = z.enum(ROLES);

export const RIDE_STATUSES = [
  'PENDING',
  'MATCHING',
  'CONFIRMED',
  'STARTED',
  'COMPLETED',
  'CANCELLED',
] as const;
export type RideStatus = (typeof RIDE_STATUSES)[number];
export const RideStatusSchema = z.enum(RIDE_STATUSES);

export const OFFER_STATUSES = ['PENDING', 'ACCEPTED', 'REJECTED', 'RELEASED'] as const;
export type OfferStatus = (typeof OFFER_STATUSES)[number];
export const OfferStatusSchema = z.enum(OFFER_STATUSES);

export const CAR_CATEGORIES = ['Sedan', 'SUV', 'Limousine', 'Vintage'] as const;
export type CarCategory = (typeof CAR_CATEGORIES)[number];
export const CarCategorySchema = z.enum(CAR_CATEGORIES);

export const CHAUFFEUR_STATUSES = ['AVAILABLE', 'ON_RIDE', 'OFF_DUTY'] as const;
export type ChauffeurStatus = (typeof CHAUFFEUR_STATUSES)[number];
export const ChauffeurStatusSchema = z.enum(CHAUFFEUR_STATUSES);

export const NOTIFICATION_TYPES = [
  'ride:new',
  'offer:accepted',
  'ride:confirmed',
  'ride:cancelled',
  'ride:started',
  'ride:completed',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
export const NotificationTypeSchema = z.enum(NOTIFICATION_TYPES);
