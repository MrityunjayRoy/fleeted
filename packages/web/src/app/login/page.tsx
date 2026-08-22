'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ROLES, type Role } from '@fleeted/shared';

import { api, ApiError } from '../../lib/api';
import { DASHBOARD_PATHS, readStoredSession, useAuth } from '../../lib/auth';
import { useToast } from '../../lib/toast';
import { Button, Card, CenteredSpinner, Spinner } from '../../components/ui';

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  CUSTOMER: 'Book luxury rides and track your chauffeur',
  VENDOR: 'Accept ride requests and manage your fleet',
  OPS: 'Approve offers and supervise the network',
  DRIVER: 'See your assignments and update ride status',
};

interface AccountOption {
  id: string;
  name: string;
}

export default function LoginPage() {
  const { status, login } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [accounts, setAccounts] = useState<AccountOption[] | null>(null);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [signingIn, setSigningIn] = useState<AccountOption | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      const stored = readStoredSession();
      router.replace(DASHBOARD_PATHS[stored?.role ?? 'CUSTOMER'] ?? '/');
    }
  }, [status, router]);

  const selectRole = useCallback(
    async (role: Role) => {
      setSelectedRole(role);
      setAccounts(null);
      setError(null);
      setLoadingAccounts(true);
      try {
        const result = await api.get<{ accounts: AccountOption[] }>(
          `/api/auth/accounts?role=${role}`,
        );
        setAccounts(result.accounts);
      } catch (e) {
        const message = e instanceof ApiError ? e.message : 'Could not load accounts';
        setError(message);
        toast({ kind: 'error', message });
      } finally {
        setLoadingAccounts(false);
      }
    },
    [toast],
  );

  const signIn = useCallback(
    async (account: AccountOption) => {
      if (!selectedRole) return;
      setSigningIn(account);
      setError(null);
      try {
        await login(selectedRole, account.name);
        router.replace(DASHBOARD_PATHS[selectedRole] ?? '/');
      } catch (e) {
        const message = e instanceof ApiError ? e.message : 'Sign in failed';
        setError(message);
        toast({ kind: 'error', message });
      } finally {
        setSigningIn(null);
      }
    },
    [login, router, selectedRole, toast],
  );

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <CenteredSpinner label="Loading…" />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-zinc-950 px-4 py-12 text-zinc-100">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Fleeted</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Luxury ride booking demo — pick a role and an account to continue
        </p>
      </div>

      <div className="grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
        {ROLES.map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => void selectRole(role)}
            className={`rounded-xl border p-5 text-left transition-colors ${
              selectedRole === role
                ? 'border-amber-500/60 bg-amber-500/5'
                : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-600'
            }`}
          >
            <p className="font-medium">{role}</p>
            <p className="mt-1 text-sm text-zinc-500">{ROLE_DESCRIPTIONS[role]}</p>
          </button>
        ))}
      </div>

      {selectedRole !== null && (
        <Card className="w-full max-w-3xl">
          <p className="mb-3 text-sm font-medium text-zinc-400">
            Accounts for <span className="text-zinc-200">{selectedRole}</span>
          </p>
          {loadingAccounts ? (
            <div className="flex items-center justify-center py-6">
              <Spinner />
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(accounts ?? []).map((account) => (
                <Button
                  key={account.id}
                  variant="secondary"
                  loading={signingIn?.id === account.id}
                  disabled={signingIn !== null}
                  onClick={() => void signIn(account)}
                >
                  {account.name}
                </Button>
              ))}
              {!loadingAccounts && (accounts ?? []).length === 0 && (
                <p className="text-sm text-zinc-500">No accounts seeded for this role.</p>
              )}
            </div>
          )}
          {error !== null && <p className="mt-3 text-sm text-red-400">{error}</p>}
        </Card>
      )}
    </main>
  );
}
