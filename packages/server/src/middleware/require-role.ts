import type { RequestHandler } from 'express';
import type { Role } from '@fleeted/shared';

export function requireRole(...roles: Role[]): RequestHandler {
  return (req, res, next) => {
    if (!req.auth) {
      res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }
    if (!roles.includes(req.auth.role)) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: `Role ${req.auth.role} is not allowed to perform this action`,
        },
      });
      return;
    }
    next();
  };
}
