import { z } from 'zod';
import jwt, { type SignOptions } from 'jsonwebtoken';
import type { RequestHandler } from 'express';

import { RoleSchema } from '@fleeted/shared';
import type { Account } from '../domain/entities/index.js';

const AuthTokenPayloadSchema = z.object({
  sub: z.string(),
  role: RoleSchema,
  name: z.string(),
  customerId: z.string().optional(),
  vendorId: z.string().optional(),
  chauffeurId: z.string().optional(),
});

export type AuthContext = z.infer<typeof AuthTokenPayloadSchema>;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

export function signToken(secret: string, expiresIn: string, account: Account): string {
  const payload = {
    sub: account.id,
    role: account.role,
    name: account.name,
    ...(account.userId !== undefined ? { customerId: account.userId } : {}),
    ...(account.vendorId !== undefined ? { vendorId: account.vendorId } : {}),
    ...(account.chauffeurId !== undefined ? { chauffeurId: account.chauffeurId } : {}),
  };
  const options: SignOptions = {
    expiresIn: expiresIn as Exclude<SignOptions['expiresIn'], undefined>,
    algorithm: 'HS256',
  };
  return jwt.sign(payload, secret, options);
}

export function verifyToken(token: string, secret: string): AuthContext {
  const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
  return AuthTokenPayloadSchema.parse(decoded);
}

export function createAuthMiddleware(secret: string): RequestHandler {
  return (req, _res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      next();
      return;
    }
    try {
      req.auth = verifyToken(header.slice('Bearer '.length), secret);
    } catch {
      delete req.auth;
    }
    next();
  };
}
