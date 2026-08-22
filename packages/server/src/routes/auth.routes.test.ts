import type { AddressInfo } from 'node:net';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';

import { createApp } from '../app.js';
import { createContainer, type Container } from '../config/container.js';
import { seed } from '../db/seed.js';

const SECRET = 'test-secret-at-least-16-chars';

describe('auth routes (HTTP)', () => {
  let container: Container;
  let server: Server;
  let baseUrl: string;

  beforeEach(async () => {
    container = createContainer(':memory:', { runMigrations: true, jwtSecret: SECRET });
    await seed(container);
    const app = createApp(container);
    server = app.listen(0);
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://localhost:${port}`;
  });

  afterEach(() => {
    server.close();
  });

  it('POST /api/auth/login returns a token for a seeded account', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ role: 'VENDOR', name: 'Royal Rides India' }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      role: string;
      userId: string;
      displayName: string;
      token: string;
    };
    expect(body).toMatchObject({
      role: 'VENDOR',
      userId: 'account-vendor-royal',
      displayName: 'Royal Rides India',
    });
    expect(body.token).toBeTruthy();
  });

  it('POST /api/auth/login returns a 401 envelope for an unknown account', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ role: 'OPS', name: 'Nobody Here' }),
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual(
      expect.objectContaining({ error: expect.objectContaining({ code: 'UNAUTHORIZED' }) }),
    );
  });

  it('GET /api/auth/me resolves the current account from the token', async () => {
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ role: 'CUSTOMER', name: 'Arjun Mehta' }),
    });
    const { token } = (await loginRes.json()) as { token: string };

    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ role: 'CUSTOMER', displayName: 'Arjun Mehta' });
  });

  it('GET /api/auth/me without a token returns 401', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`);
    expect(res.status).toBe(401);
  });

  it('GET /api/auth/accounts lists seeded accounts for a role', async () => {
    const res = await fetch(`${baseUrl}/api/auth/accounts?role=VENDOR`);

    expect(res.status).toBe(200);
    const body = (await res.json()) as { accounts: Array<{ id: string; name: string }> };
    expect(body.accounts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'account-vendor-royal', name: 'Royal Rides India' }),
      ]),
    );
  });

  it('GET /api/auth/accounts rejects an unknown role', async () => {
    const res = await fetch(`${baseUrl}/api/auth/accounts?role=SUPERUSER`);
    expect(res.status).toBe(400);
  });
});
