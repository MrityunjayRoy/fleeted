import { describe, expect, it, beforeEach } from 'vitest';

import { createContainer, type Container } from '../config/container.js';
import { seed } from '../db/seed.js';
import { UnauthorizedError } from '../domain/errors.js';
import { verifyToken } from '../middleware/auth.js';

describe('AuthService', () => {
  let container: Container;

  beforeEach(async () => {
    container = createContainer(':memory:', {
      runMigrations: true,
      jwtSecret: 'test-secret-at-least-16-chars',
    });
    await seed(container);
  });

  it('returns a valid JWT for a seeded account', async () => {
    const result = await container.services.auth.login({
      role: 'CUSTOMER',
      name: 'Priya Nair',
    });

    expect(result).toMatchObject({
      role: 'CUSTOMER',
      userId: 'account-customer-priya',
      displayName: 'Priya Nair',
    });
    expect(result.token).toBeTruthy();

    const payload = verifyToken(result.token, 'test-secret-at-least-16-chars');
    expect(payload).toMatchObject({
      sub: 'account-customer-priya',
      role: 'CUSTOMER',
      customerId: 'user-priya-nair',
    });
  });

  it('embeds vendor and chauffeur scoping ids for their roles', async () => {
    const vendorLogin = await container.services.auth.login({
      role: 'VENDOR',
      name: 'Royal Rides India',
    });
    expect(verifyToken(vendorLogin.token, 'test-secret-at-least-16-chars')).toMatchObject({
      sub: 'account-vendor-royal',
      vendorId: 'vendor-royal-rides',
    });

    const driverLogin = await container.services.auth.login({
      role: 'DRIVER',
      name: 'Rohan Verma',
    });
    expect(verifyToken(driverLogin.token, 'test-secret-at-least-16-chars')).toMatchObject({
      sub: 'account-driver-company-1',
      chauffeurId: 'chauffeur-company-1',
    });
  });

  it('throws UnauthorizedError for an unknown account', async () => {
    await expect(
      container.services.auth.login({ role: 'OPS', name: 'Nobody Here' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('resolves the current account via me()', async () => {
    const login = await container.services.auth.login({ role: 'OPS', name: 'Ananya Desai' });
    const me = await container.services.auth.me(login.userId);
    expect(me).toMatchObject({ role: 'OPS', displayName: 'Ananya Desai' });
  });
});
