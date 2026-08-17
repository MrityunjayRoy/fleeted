import {
  CarCategorySchema,
  ChauffeurStatusSchema,
  NotificationTypeSchema,
  OfferStatusSchema,
  RideStatusSchema,
  RoleSchema,
} from '@fleeted/shared';

import type {
  Account,
  CarModel,
  Chauffeur,
  Notification,
  Ride,
  RideOffer,
  User,
  Vendor,
  VendorCar,
} from '../../domain/entities/index.js';
import {
  accounts,
  carModels,
  chauffeurs,
  notifications,
  rideOffers,
  rides,
  users,
  vendorCars,
  vendors,
} from '../schema/index.js';

export function toAccount(row: typeof accounts.$inferSelect): Account {
  return {
    id: row.id,
    role: RoleSchema.parse(row.role),
    name: row.name,
    ...(row.userId !== null ? { userId: row.userId } : {}),
    ...(row.vendorId !== null ? { vendorId: row.vendorId } : {}),
    ...(row.chauffeurId !== null ? { chauffeurId: row.chauffeurId } : {}),
  };
}

export function toUser(row: typeof users.$inferSelect): User {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
  };
}

export function toVendor(row: typeof vendors.$inferSelect): Vendor {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    isCompany: row.isCompany,
  };
}

export function toCarModel(row: typeof carModels.$inferSelect): CarModel {
  return {
    id: row.id,
    name: row.name,
    category: CarCategorySchema.parse(row.category),
    basePrice: row.basePrice,
    pricePerKm: row.pricePerKm,
    capacity: row.capacity,
    description: row.description,
  };
}

export function toVendorCar(row: typeof vendorCars.$inferSelect): VendorCar {
  return {
    id: row.id,
    vendorId: row.vendorId,
    modelId: row.modelId,
    plateNumber: row.plateNumber,
    isAvailable: row.isAvailable,
  };
}

export function toChauffeur(row: typeof chauffeurs.$inferSelect): Chauffeur {
  return {
    id: row.id,
    vendorId: row.vendorId,
    name: row.name,
    phone: row.phone,
    licenseNumber: row.licenseNumber,
    status: ChauffeurStatusSchema.parse(row.status),
  };
}

export function toRide(row: typeof rides.$inferSelect): Ride {
  return {
    id: row.id,
    customerId: row.customerId,
    modelId: row.modelId,
    pickup: row.pickup,
    dropoff: row.dropoff,
    pickupTime: row.pickupTime,
    distanceKm: row.distanceKm,
    price: row.price,
    status: RideStatusSchema.parse(row.status),
    createdAt: row.createdAt,
    ...(row.notes !== null ? { notes: row.notes } : {}),
    ...(row.confirmedAt !== null ? { confirmedAt: row.confirmedAt } : {}),
    ...(row.startedAt !== null ? { startedAt: row.startedAt } : {}),
    ...(row.completedAt !== null ? { completedAt: row.completedAt } : {}),
    ...(row.cancelledAt !== null ? { cancelledAt: row.cancelledAt } : {}),
  };
}

export function toRideOffer(row: typeof rideOffers.$inferSelect): RideOffer {
  return {
    id: row.id,
    rideId: row.rideId,
    vendorId: row.vendorId,
    status: OfferStatusSchema.parse(row.status),
    createdAt: row.createdAt,
    ...(row.vendorCarId !== null ? { vendorCarId: row.vendorCarId } : {}),
    ...(row.chauffeurId !== null ? { chauffeurId: row.chauffeurId } : {}),
    ...(row.acceptedAt !== null ? { acceptedAt: row.acceptedAt } : {}),
    ...(row.rejectedAt !== null ? { rejectedAt: row.rejectedAt } : {}),
    ...(row.releasedAt !== null ? { releasedAt: row.releasedAt } : {}),
  };
}

export function toNotification(row: typeof notifications.$inferSelect): Notification {
  return {
    id: row.id,
    recipientRole: RoleSchema.parse(row.recipientRole),
    recipientId: row.recipientId,
    type: NotificationTypeSchema.parse(row.type),
    message: row.message,
    payload: JSON.parse(row.payload) as Record<string, unknown>,
    read: row.read,
    createdAt: row.createdAt,
  };
}
