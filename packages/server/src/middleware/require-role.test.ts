import { describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';

import type { AuthContext } from './auth.js';
import { requireRole } from './require-role.js';

function makeReq(auth?: AuthContext): Request {
  return { auth } as Request;
}

function makeRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

describe('requireRole', () => {
  it('returns 401 when no auth context is attached', () => {
    const req = makeReq();
    const res = makeRes();
    const next = vi.fn() as NextFunction;

    requireRole('OPS')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when the role does not match', () => {
    const req = makeReq({ sub: 'a1', role: 'VENDOR', name: 'Royal Rides India' });
    const res = makeRes();
    const next = vi.fn() as NextFunction;

    requireRole('OPS')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'FORBIDDEN' }),
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('allows any of the listed roles', () => {
    const req = makeReq({ sub: 'a1', role: 'DRIVER', name: 'Rohan Verma' });
    const res = makeRes();
    const next = vi.fn() as NextFunction;

    requireRole('DRIVER', 'OPS')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
