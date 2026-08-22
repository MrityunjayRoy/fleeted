import type { Request, Response } from 'express';

import { AcceptOfferRequestSchema } from '@fleeted/shared';

import { toRideOfferDto } from '../dto/mappers.js';
import { InsufficientVendorAccessError, NotFoundError } from '../domain/errors/index.js';
import type { OfferService } from '../services/offer.service.js';

export class OfferController {
  constructor(private readonly offers: OfferService) {}

  getById = async (req: Request, res: Response): Promise<void> => {
    const detail = await this.offers.getById(req.params.id as string);
    if (!detail) throw new NotFoundError(`No offer with id "${req.params.id}"`);
    const auth = req.auth;
    if (auth?.role === 'VENDOR' && detail.offer.vendorId !== auth.vendorId) {
      throw new InsufficientVendorAccessError('This offer belongs to another vendor');
    }
    res.json(toRideOfferDto(detail));
  };

  accept = async (req: Request, res: Response): Promise<void> => {
    const input = AcceptOfferRequestSchema.parse(req.body);
    const vendorId = req.auth?.vendorId;
    if (vendorId === undefined) throw new NotFoundError('Vendor account has no vendor profile');
    const accepted = await this.offers.accept(req.params.id as string, vendorId, input);
    const detail = await this.offers.getById(accepted.id);
    if (!detail) throw new NotFoundError(`No offer with id "${accepted.id}"`);
    res.json(toRideOfferDto(detail));
  };

  reject = async (req: Request, res: Response): Promise<void> => {
    const vendorId = req.auth?.vendorId;
    if (vendorId === undefined) throw new NotFoundError('Vendor account has no vendor profile');
    await this.offers.reject(req.params.id as string, vendorId);
    const detail = await this.offers.getById(req.params.id as string);
    if (!detail) throw new NotFoundError(`No offer with id "${req.params.id}"`);
    res.json(toRideOfferDto(detail));
  };
}
