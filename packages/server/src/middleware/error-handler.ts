import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

import { AppError } from '../domain/errors/index.js';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({
      error: { code: 'VALIDATION', message: err.issues[0]?.message ?? 'Invalid request' },
    });
    return;
  }
  console.error('[server] unhandled error:', err);
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Internal server error' } });
};
