import type { Request, Response } from 'express';

import { CreateRideRequestSchema, type CreateRideRequest } from '@fleeted/shared';

import { toRideDto } from '../dto/mappers.js';
import { NotFoundError, UnauthorizedError } from '../domain/errors/index.js';
import type { RideService } from '../services/ride.service.js';
import type { Actor } from '../domain/entities/index.js';
import type { CreateRideInput } from '../services/ride.service.js';

export class RideController {
  constructor(private readonly rides: RideService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const parsed = CreateRideRequestSchema.parse(req.body);
    const customerId = req.auth?.customerId;
    if (customerId === undefined) {
      throw new NotFoundError('Customer account has no user profile');
    }
    const { ride } = await this.rides.create(toCreateRideInput(parsed), customerId);
    const detail = await this.rides.getById(ride.id, actorOf(req));
    if (!detail) throw new NotFoundError(`No ride with id "${ride.id}"`);
    res.status(201).json(toRideDto(detail));
  };

  mine = async (req: Request, res: Response): Promise<void> => {
    const rides = await this.rides.getMine(actorOf(req));
    res.json(rides.map(toRideDto));
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const detail = await this.rides.getById(req.params.id as string, actorOf(req));
    if (!detail) throw new NotFoundError(`No ride with id "${req.params.id}"`);
    res.json(toRideDto(detail));
  };

  cancel = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const auth = req.auth;
    if (!auth) throw new UnauthorizedError();
    if (auth.role === 'OPS') {
      await this.rides.cancelByOps(id);
    } else {
      await this.rides.cancelByCustomer(id, auth.customerId ?? '');
    }
    const detail = await this.rides.getById(id, actorOf(req));
    if (!detail) throw new NotFoundError(`No ride with id "${id}"`);
    res.json(toRideDto(detail));
  };
}

function toCreateRideInput(input: CreateRideRequest): CreateRideInput {
  return {
    modelId: input.modelId,
    pickup: input.pickup,
    dropoff: input.dropoff,
    pickupTime: input.pickupTime,
    distanceKm: input.distanceKm,
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
  };
}

function actorOf(req: Request): Actor {
  const auth = req.auth;
  if (!auth) throw new UnauthorizedError();
  return {
    role: auth.role,
    ...(auth.customerId !== undefined ? { customerId: auth.customerId } : {}),
    ...(auth.vendorId !== undefined ? { vendorId: auth.vendorId } : {}),
    ...(auth.chauffeurId !== undefined ? { chauffeurId: auth.chauffeurId } : {}),
  };
}
