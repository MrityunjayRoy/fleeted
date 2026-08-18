import { AppError } from './app-error.js';

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, 'NOT_FOUND', message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Invalid input') {
    super(400, 'VALIDATION', message);
    this.name = 'ValidationError';
  }
}

export class CarNotAvailableError extends AppError {
  constructor(message = 'The selected car is no longer available') {
    super(409, 'CAR_NOT_AVAILABLE', message);
    this.name = 'CarNotAvailableError';
  }
}

export class ChauffeurNotAvailableError extends AppError {
  constructor(message = 'The selected chauffeur is no longer available') {
    super(409, 'CHAUFFEUR_NOT_AVAILABLE', message);
    this.name = 'ChauffeurNotAvailableError';
  }
}

export class OfferAlreadyAcceptedError extends AppError {
  constructor(message = 'This offer has already been accepted') {
    super(409, 'OFFER_ALREADY_ACCEPTED', message);
    this.name = 'OfferAlreadyAcceptedError';
  }
}

export class OfferNotPendingError extends AppError {
  constructor(message = 'This offer is no longer pending') {
    super(409, 'OFFER_NOT_PENDING', message);
    this.name = 'OfferNotPendingError';
  }
}

export class RideStateTransitionError extends AppError {
  constructor(message = 'This ride cannot change to the requested state') {
    super(409, 'RIDE_STATE_TRANSITION', message);
    this.name = 'RideStateTransitionError';
  }
}

export class InsufficientVendorAccessError extends AppError {
  constructor(message = 'You do not have access to this vendor resource') {
    super(403, 'INSUFFICIENT_VENDOR_ACCESS', message);
    this.name = 'InsufficientVendorAccessError';
  }
}
