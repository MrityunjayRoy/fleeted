import express, { type Express, type ErrorRequestHandler } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

import { HealthResponseSchema, type HealthResponse } from '@fleeted/shared';

import type { Container } from './config/container.js';
import { createAuthMiddleware } from './middleware/auth.js';
import { errorHandler } from './middleware/error-handler.js';
import { createAuthRouter } from './routes/auth.routes.js';
import { createCatalogRouter } from './routes/catalog.routes.js';
import { createRideRouter } from './routes/ride.routes.js';
import { createOfferRouter } from './routes/offer.routes.js';
import { createVendorRouter } from './routes/vendor.routes.js';
import { createOpsRouter } from './routes/ops.routes.js';
import { createDriverRouter } from './routes/driver.routes.js';
import { createNotificationRouter } from './routes/notification.routes.js';

export function createApp(container: Container): Express {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));
  app.use(createAuthMiddleware(container.config.jwtSecret));

  app.get('/health', (_req, res) => {
    const body: HealthResponse = { ok: true };
    res.json(HealthResponseSchema.parse(body));
  });

  const s = container.services;
  app.use('/api/auth', createAuthRouter(s.auth));
  app.use('/api/car-models', createCatalogRouter(container.repos.carModels));
  app.use('/api/rides', createRideRouter(s.rides));
  app.use('/api/offers', createOfferRouter(s.offers));
  app.use('/api/vendors', createVendorRouter(s.offers, s.vendors));
  app.use('/api/ops', createOpsRouter(s.ops, s.rides));
  app.use('/api/driver', createDriverRouter(s.drivers, s.rides));
  app.use('/api/notifications', createNotificationRouter(s.notifications));

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });

  app.use(errorHandler as ErrorRequestHandler);

  return app;
}
