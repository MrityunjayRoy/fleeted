'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AuthResponse, MeResponse, Role } from '@fleeted/shared';

import { api, ApiError } from './api';

export interface Session {
  token: string;
  role: Role;
  userId: string;
  displayName: string;
  customerId?: string;
  vendorId?: string;
  chauffeurId?: string;
}

type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

interface AuthContextValue {
  status: AuthStatus;
  session: Session | null;
  login: (role: Role, name: string) => Promise<void>;
  logout: () => void;
}

const STORAGE_KEY = 'fleeted.session';

export function readStoredSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw !== null ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export const DASHBOARD_PATHS: Record<Role, string> = {
  CUSTOMER: '/customer',
  VENDOR: '/vendor',
  OPS: '/ops',
  DRIVER: '/driver',
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const parsed = readStoredSession();
    if (parsed === null) {
      setStatus('anonymous');
      return;
    }
    api
      .get<MeResponse>('/api/auth/me', parsed.token)
      .then((me) => {
        setSession({
          ...parsed,
          role: me.role,
          userId: me.userId,
          displayName: me.displayName,
          ...(me.customerId !== undefined ? { customerId: me.customerId } : {}),
          ...(me.vendorId !== undefined ? { vendorId: me.vendorId } : {}),
          ...(me.chauffeurId !== undefined ? { chauffeurId: me.chauffeurId } : {}),
        });
        setStatus('authenticated');
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 401) {
          localStorage.removeItem(STORAGE_KEY);
          setSession(null);
          setStatus('anonymous');
          return;
        }
        setSession(parsed);
        setStatus('authenticated');
      });
  }, []);

  const login = useCallback(async (role: Role, name: string) => {
    const result = await api.post<AuthResponse>('/api/auth/login', { role, name });
    const next: Session = {
      token: result.token,
      role: result.role,
      userId: result.userId,
      displayName: result.displayName,
      ...(result.customerId !== undefined ? { customerId: result.customerId } : {}),
      ...(result.vendorId !== undefined ? { vendorId: result.vendorId } : {}),
      ...(result.chauffeurId !== undefined ? { chauffeurId: result.chauffeurId } : {}),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSession(next);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
    setStatus('anonymous');
  }, []);

  const value = useMemo(
    () => ({ status, session, login, logout }),
    [status, session, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
