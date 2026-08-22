'use client';

import type { ReactNode } from 'react';
import { SWRConfig } from 'swr';

import { AuthProvider } from '../lib/auth';
import { ToastProvider } from '../lib/toast';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <SWRConfig
          value={{
            revalidateOnFocus: false,
            dedupingInterval: 1500,
            errorRetryCount: 2,
          }}
        >
          {children}
        </SWRConfig>
      </AuthProvider>
    </ToastProvider>
  );
}
