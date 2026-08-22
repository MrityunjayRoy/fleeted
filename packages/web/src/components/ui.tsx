'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { ChauffeurStatus, OfferStatus, RideStatus } from '@fleeted/shared';

const TONES: Record<string, string> = {
  amber: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  sky: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
  red: 'bg-red-500/10 text-red-300 border-red-500/30',
  zinc: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30',
  violet: 'bg-violet-500/10 text-violet-300 border-violet-500/30',
};

const RIDE_TONE: Record<RideStatus, string> = {
  PENDING: 'zinc',
  MATCHING: 'amber',
  CONFIRMED: 'emerald',
  STARTED: 'sky',
  COMPLETED: 'violet',
  CANCELLED: 'red',
};

const OFFER_TONE: Record<OfferStatus, string> = {
  PENDING: 'amber',
  ACCEPTED: 'emerald',
  REJECTED: 'red',
  RELEASED: 'zinc',
};

const CHAUFFEUR_TONE: Record<ChauffeurStatus, string> = {
  AVAILABLE: 'emerald',
  ON_RIDE: 'sky',
  OFF_DUTY: 'zinc',
};

export function StatusBadge({ status }: { status: RideStatus | OfferStatus | ChauffeurStatus }) {
  const tone =
    RIDE_TONE[status as RideStatus] ??
    OFFER_TONE[status as OfferStatus] ??
    CHAUFFEUR_TONE[status as ChauffeurStatus] ??
    'zinc';
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${TONES[tone]}`}
    >
      {status}
    </span>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 ${className}`}>
      {children}
    </div>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
}

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-amber-500 text-zinc-950 hover:bg-amber-400 disabled:hover:bg-amber-500',
  secondary: 'border border-zinc-700 text-zinc-200 hover:border-zinc-500 hover:text-white',
  ghost: 'text-zinc-300 hover:text-white hover:bg-zinc-800/60',
  danger: 'bg-red-600/90 text-white hover:bg-red-500',
};

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${BUTTON_VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {loading && <Spinner className="h-4 w-4 border-current" />}
      {children}
    </button>
  );
}

export function Spinner({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <span
      aria-label="Loading"
      className={`inline-block animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-300 ${className}`}
    />
  );
}

export function CenteredSpinner({ label }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-zinc-500">
      <Spinner />
      {label !== undefined && <p className="text-sm">{label}</p>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-800 py-14 text-center">
      <p className="text-sm font-medium text-zinc-300">{title}</p>
      {description !== undefined && <p className="text-sm text-zinc-500">{description}</p>}
      {action !== undefined && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function SectionHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-100">{title}</h1>
        {subtitle !== undefined && <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>}
      </div>
      {right !== undefined && <div className="shrink-0">{right}</div>}
    </div>
  );
}
