import express, { type Express, type ErrorRequestHandler } from 'express';

import { HealthResponseSchema, type HealthResponse } from '@fleeted/shared';

import type { Container } from './config/container.js';
import { AppError } from './domain/errors.js';
import { createAuthMiddleware } from './middleware/auth.js';
import { createAuthRouter } from './routes/auth.routes.js';

export function createApp(container: Container): Express {
  const app = express();

  app.use(express.json());
  app.use(createAuthMiddleware(container.config.jwtSecret));

  app.get('/health', (_req, res) => {
    const body: HealthResponse = { ok: true };
    res.json(HealthResponseSchema.parse(body));
  });

  app.use('/api/auth', createAuthRouter(container.services.auth));

  app.use(errorHandler);

  return app;
}

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
    return;
  }
  console.error('[server] unhandled error:', err);
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Internal server error' } });
};
