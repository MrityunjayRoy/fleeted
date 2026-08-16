import express, { type Express } from 'express';

import { HealthResponseSchema, type HealthResponse } from '@fleeted/shared';

export function createApp(): Express {
  const app = express();

  app.use(express.json());

  app.get('/health', (_req, res) => {
    const body: HealthResponse = { ok: true };
    res.json(HealthResponseSchema.parse(body));
  });

  return app;
}
