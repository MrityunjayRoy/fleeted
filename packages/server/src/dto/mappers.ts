import type {
  CarModelDto,
  ChauffeurDto,
  CustomerSummaryDto,
  NotificationDto,
  RideDto,
  RideOfferDto,
  VendorCarDto,
  VendorDto,
} from '@fleeted/shared';

import type {
  CarModel,
  Chauffeur,
  Notification,
  RideOfferWithDetails,
  RideWithParticipants,
  User,
  Vendor,
  VendorCar,
} from '../domain/entities/index.js';

export function toCarModelDto(model: CarModel): CarModelDto {
  return {
    id: model.id,
    name: model.name,
    category: model.category,
    basePrice: model.basePrice,
    pricePerKm: model.pricePerKm,
    capacity: model.capacity,
    description: model.description,
  };
}

export function toVendorDto(vendor: Vendor): VendorDto {
  return {
    id: vendor.id,
    name: vendor.name,
    phone: vendor.phone,
    isCompany: vendor.isCompany,
  };
}

export function toChauffeurDto(chauffeur: Chauffeur): ChauffeurDto {
  return {
    id: chauffeur.id,
    vendorId: chauffeur.vendorId,
    name: chauffeur.name,
    phone: chauffeur.phone,
    licenseNumber: chauffeur.licenseNumber,
    status: chauffeur.status,
  };
}

export function toVendorCarDto(car: VendorCar): VendorCarDto {
  return {
    id: car.id,
    vendorId: car.vendorId,
    modelId: car.modelId,
    plateNumber: car.plateNumber,
    isAvailable: car.isAvailable,
  };
}

export function toCustomerSummaryDto(user: User): CustomerSummaryDto {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
  };
}

export function toRideOfferDto(detail: RideOfferWithDetails): RideOfferDto {
  const ride =
    detail.ride !== null && detail.model !== null
      ? {
          id: detail.ride.id,
          status: detail.ride.status,
          model: toCarModelDto(detail.model),
          pickup: detail.ride.pickup,
          dropoff: detail.ride.dropoff,
          pickupTime: detail.ride.pickupTime,
          distanceKm: detail.ride.distanceKm,
          price: detail.ride.price,
          ...(detail.ride.notes !== undefined ? { notes: detail.ride.notes } : {}),
        }
      : undefined;
  return {
    id: detail.offer.id,
    rideId: detail.offer.rideId,
    vendorId: detail.offer.vendorId,
    vendor: toVendorDto(detail.vendor),
    ...(ride !== undefined ? { ride } : {}),
    ...(detail.vendorCar !== null ? { vendorCar: toVendorCarDto(detail.vendorCar) } : {}),
    ...(detail.chauffeur !== null ? { chauffeur: toChauffeurDto(detail.chauffeur) } : {}),
    status: detail.offer.status,
    createdAt: detail.offer.createdAt,
    ...(detail.offer.acceptedAt !== undefined ? { acceptedAt: detail.offer.acceptedAt } : {}),
    ...(detail.offer.rejectedAt !== undefined ? { rejectedAt: detail.offer.rejectedAt } : {}),
    ...(detail.offer.releasedAt !== undefined ? { releasedAt: detail.offer.releasedAt } : {}),
  };
}

export function toRideDto(detail: RideWithParticipants): RideDto {
  const accepted = detail.offers.find((o) => o.offer.status === 'ACCEPTED');
  return {
    id: detail.ride.id,
    status: detail.ride.status,
    price: detail.ride.price,
    pickup: detail.ride.pickup,
    dropoff: detail.ride.dropoff,
    pickupTime: detail.ride.pickupTime,
    distanceKm: detail.ride.distanceKm,
    ...(detail.ride.notes !== undefined ? { notes: detail.ride.notes } : {}),
    model: toCarModelDto(detail.model),
    customer: toCustomerSummaryDto(detail.customer),
    ...(accepted && accepted.vendorCar !== null && accepted.chauffeur !== null
      ? {
          assignment: {
            vendor: toVendorDto(accepted.vendor),
            car: toVendorCarDto(accepted.vendorCar),
            chauffeur: toChauffeurDto(accepted.chauffeur),
          },
        }
      : {}),
    createdAt: detail.ride.createdAt,
    ...(detail.ride.confirmedAt !== undefined ? { confirmedAt: detail.ride.confirmedAt } : {}),
    ...(detail.ride.startedAt !== undefined ? { startedAt: detail.ride.startedAt } : {}),
    ...(detail.ride.completedAt !== undefined ? { completedAt: detail.ride.completedAt } : {}),
    ...(detail.ride.cancelledAt !== undefined ? { cancelledAt: detail.ride.cancelledAt } : {}),
  };
}

export function toNotificationDto(notification: Notification): NotificationDto {
  return {
    id: notification.id,
    recipientRole: notification.recipientRole,
    recipientId: notification.recipientId,
    type: notification.type,
    message: notification.message,
    payload: notification.payload,
    read: notification.read,
    createdAt: notification.createdAt,
  };
}
