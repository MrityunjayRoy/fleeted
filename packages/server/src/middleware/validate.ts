import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

export function validate<T>(schema: ZodType<T>): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION',
          message: result.error.issues[0]?.message ?? 'Invalid request body',
        },
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateParams<T>(schema: ZodType<T>): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION',
          message: result.error.issues[0]?.message ?? 'Invalid request parameters',
        },
      });
      return;
    }
    next();
  };
}
