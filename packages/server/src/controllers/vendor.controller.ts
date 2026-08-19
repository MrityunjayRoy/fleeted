import type { Request, Response } from 'express';

import { AvailabilityToggleRequestSchema } from '@fleeted/shared';

import { toRideOfferDto } from '../dto/mappers.js';
import { InsufficientVendorAccessError } from '../domain/errors/index.js';
import type { OfferService } from '../services/offer.service.js';
import type { VendorService } from '../services/vendor.service.js';

export class VendorController {
  constructor(
    private readonly offers: OfferService,
    private readonly vendors: VendorService,
  ) {}

  listOffers = async (req: Request, res: Response): Promise<void> => {
    const vendorId = this.ownVendorId(req);
    const offers = await this.offers.listByVendor(vendorId);
    res.json(offers.map(toRideOfferDto));
  };

  listCars = async (req: Request, res: Response): Promise<void> => {
    const vendorId = this.ownVendorId(req);
    const fleet = await this.vendors.listFleet(vendorId);
    res.json(fleet);
  };

  setCarAvailability = async (req: Request, res: Response): Promise<void> => {
    const vendorId = this.ownVendorId(req);
    const input = AvailabilityToggleRequestSchema.parse(req.body);
    await this.vendors.setCarAvailability(req.params.carId as string, vendorId, input.isAvailable);
    res.status(204).end();
  };

  private ownVendorId(req: Request): string {
    const vendorId = req.auth?.vendorId;
    if (vendorId === undefined || vendorId !== req.params.vendorId) {
      throw new InsufficientVendorAccessError('You can only access your own vendor resources');
    }
    return vendorId;
  }
}
