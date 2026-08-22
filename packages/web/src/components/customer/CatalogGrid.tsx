'use client';

import type { CarCategory, CarModelDto } from '@fleeted/shared';

import { formatInr } from '../../lib/format';

const CATEGORY_TONES: Record<CarCategory, string> = {
  Sedan: 'border-zinc-600/40 text-zinc-300',
  SUV: 'border-sky-500/40 text-sky-300',
  Limousine: 'border-amber-500/40 text-amber-300',
  Vintage: 'border-violet-500/40 text-violet-300',
};

export function CatalogGrid({
  models,
  selectedId,
  onSelect,
}: {
  models: CarModelDto[];
  selectedId: string | null;
  onSelect: (model: CarModelDto) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {models.map((model) => {
        const selected = model.id === selectedId;
        return (
          <button
            key={model.id}
            type="button"
            onClick={() => onSelect(model)}
            className={`rounded-xl border p-4 text-left transition-colors ${
              selected
                ? 'border-amber-500/60 bg-amber-500/5'
                : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-600'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-zinc-100">{model.name}</p>
              <span
                className={`rounded-full border px-2 py-0.5 text-[11px] ${CATEGORY_TONES[model.category]}`}
              >
                {model.category}
              </span>
            </div>
            <p className="mt-2 text-sm text-zinc-400">
              <span className="font-semibold text-amber-300">{formatInr(model.basePrice)}</span>
              <span className="text-zinc-500"> base + {formatInr(model.pricePerKm)}/km</span>
            </p>
            <p className="mt-1 text-xs text-zinc-500">{model.capacity} seats</p>
          </button>
        );
      })}
    </div>
  );
}
