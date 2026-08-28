# AGENTS.md

Read `architecture.md` for full system design and `plan.md` for scope. This file covers what agents tend to get wrong.

## Stack

pnpm monorepo (Node >= 26, pnpm >= 10): `packages/shared` (Zod schemas + inferred DTO types — the API contract source of truth), `packages/server` (Express 5 + Socket.IO + Drizzle/SQLite), `packages/web` (Next.js App Router + Tailwind; customer/vendor/ops/driver dashboards).

## Commands

From repo root:

- `pnpm dev` — shared watch + API (`tsx watch`, :4000) + web (`next dev`, :3001)
- `pnpm lint` / `lint:fix` · `pnpm format` (prettier --check) / `format:fix`
- `pnpm typecheck` · `pnpm build` · `pnpm test` (Vitest, server package only)

Verify changes with: lint → typecheck → test.

- `@fleeted/shared` resolves through its compiled `dist/`; server/web typecheck and build fail if it isn't built. Build it first when working per-package: `pnpm --filter @fleeted/shared build` (root `dev` handles this via watch).
- Single test file: `pnpm --filter @fleeted/server exec vitest run src/services/ride.service.test.ts`
- `architecture.md` §13's script table is stale (no root `seed`, `build` doesn't typecheck, `lint` isn't prettier). Trust the `package.json` files.

## Runtime & DB

- Server needs no `.env`: `src/config/env.ts` defaults PORT=4000, DB_PATH=`./data/fleeted.db`, JWT_SECRET, JWT_EXPIRES_IN.
- Migrations run automatically on server start; demo data does not load itself — seed with `pnpm --filter @fleeted/server seed` (idempotent).
- SQLite file lives in `packages/server/data/` (gitignored). After editing `src/db/schema/`: `pnpm --filter @fleeted/server db:generate` (drizzle-kit), applied on next start or `db:migrate`.
- Login is a role switcher (role + name, no passwords) over seeded Indian-name accounts — see `src/db/seed.ts` / architecture.md §12.
- Full HTTP lifecycle acceptance run: `scripts/demo-api.sh` (needs server on :4000 with seeded DB).
- Tests spin up real HTTP servers on in-memory SQLite with seed data; no external services required. Frontend has no tests.

## Code conventions

- ESM throughout (`"type": "module"`, NodeNext): relative imports in `server`/`shared` must end in `.js` even inside `.ts` files (`from './app.js'`).
- Strict flags in `tsconfig.base.json`: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax` — expect undefined-guards on index access, `type`-only imports, and optional-property assignment care.
- Unused vars/params must be `_`-prefixed (ESLint error).
- Server layering is strict: thin controllers → services own logic → persistence only behind `db/interfaces/*` repos (Drizzle impls in `db/repositories/*`), hand-wired in `config/container.ts` (DI composition root, no decorators). Never call SQL above the repository layer.
- Side effects (Socket.IO push, notification rows) attach via typed domain events in `domain/events.ts`; services emit events instead of importing WS/notification code.
- Define request/response shapes as Zod schemas in `packages/shared` and infer types from them — never restate contract types in server or web.
- Throw typed `AppError` subclasses from `domain/errors/`; global middleware maps them to `{ error: { code, message } }`.
