import type { ErrorResponse } from '@fleeted/shared';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH';
  body?: unknown;
  token?: string;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.token !== undefined) headers.authorization = `Bearer ${options.token}`;
  if (options.body !== undefined) headers['content-type'] = 'application/json';

  const init: RequestInit = { method: options.method ?? 'GET', headers };
  if (options.body !== undefined) {
    init.body = JSON.stringify(options.body);
  }

  const res = await fetch(`${API_BASE}${path}`, init);

  if (!res.ok) {
    let code = 'UNKNOWN';
    let message = `Request failed with status ${res.status}`;
    try {
      const envelope = (await res.json()) as ErrorResponse;
      code = envelope.error.code;
      message = envelope.error.message;
    } catch {
      // non-JSON error body — keep defaults
    }
    throw new ApiError(res.status, code, message);
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

export const api = {
  get<T>(path: string, token?: string): Promise<T> {
    return apiRequest<T>(path, { ...(token !== undefined ? { token } : {}) });
  },
  post<T>(path: string, body?: unknown, token?: string): Promise<T> {
    return apiRequest<T>(path, {
      method: 'POST',
      body,
      ...(token !== undefined ? { token } : {}),
    });
  },
  patch<T>(path: string, body?: unknown, token?: string): Promise<T> {
    return apiRequest<T>(path, {
      method: 'PATCH',
      body,
      ...(token !== undefined ? { token } : {}),
    });
  },
};
