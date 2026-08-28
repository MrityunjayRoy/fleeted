import type { Request, Response } from 'express';

import { RideStatusSchema } from '@fleeted/shared';

import { toOpsRideDto } from '../dto/mappers.js';
import type { OpsService } from '../services/ops.service.js';
import type { RideService } from '../services/ride.service.js';

export class OpsController {
  constructor(
    private readonly ops: OpsService,
    private readonly rides: RideService,
  ) {}

  listRides = async (req: Request, res: Response): Promise<void> => {
    const raw = req.query.status;
    const status = raw === undefined ? undefined : RideStatusSchema.safeParse(raw);
    if (status !== undefined && !status.success) {
      res.status(400).json({
        error: { code: 'VALIDATION', message: `Invalid ride status "${raw}"` },
      });
      return;
    }
    const rides = await this.ops.listRides(status?.success ? status.data : undefined);
    res.json(rides.map(toOpsRideDto));
  };

  getRideDetail = async (req: Request, res: Response): Promise<void> => {
    const detail = await this.ops.getRideDetail(req.params.id as string);
    res.json(toOpsRideDto(detail));
  };

  approveOffer = async (req: Request, res: Response): Promise<void> => {
    const approved = await this.ops.approveOffer(req.params.id as string);
    const detail = await this.ops.getRideDetail(approved.id);
    res.json(toOpsRideDto(detail));
  };

  cancelRide = async (req: Request, res: Response): Promise<void> => {
    const cancelled = await this.rides.cancelByOps(req.params.id as string);
    const detail = await this.ops.getRideDetail(cancelled.id);
    res.json(toOpsRideDto(detail));
  };
}
