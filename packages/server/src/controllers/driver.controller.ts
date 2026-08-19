import type { Request, Response } from 'express';

import { toRideDto } from '../dto/mappers.js';
import { UnauthorizedError } from '../domain/errors/index.js';
import type { DriverService } from '../services/driver.service.js';
import type { RideService } from '../services/ride.service.js';

export class DriverController {
  constructor(
    private readonly drivers: DriverService,
    private readonly rides: RideService,
  ) {}

  start = async (req: Request, res: Response): Promise<void> => {
    const chauffeurId = this.chauffeurId(req);
    await this.drivers.start(req.params.id as string, chauffeurId);
    res.json(await this.rideDto(req.params.id as string, chauffeurId));
  };

  complete = async (req: Request, res: Response): Promise<void> => {
    const chauffeurId = this.chauffeurId(req);
    await this.drivers.complete(req.params.id as string, chauffeurId);
    res.json(await this.rideDto(req.params.id as string, chauffeurId));
  };

  private chauffeurId(req: Request): string {
    const chauffeurId = req.auth?.chauffeurId;
    if (chauffeurId === undefined) {
      throw new UnauthorizedError('Driver account has no chauffeur profile');
    }
    return chauffeurId;
  }

  private async rideDto(rideId: string, chauffeurId: string) {
    const detail = await this.rides.getById(rideId, {
      role: 'DRIVER',
      chauffeurId,
    });
    if (!detail) throw new UnauthorizedError('This ride is not assigned to you');
    return toRideDto(detail);
  }
}
