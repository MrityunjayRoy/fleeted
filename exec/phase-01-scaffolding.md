# Phase 1 — Monorepo Scaffolding & Tooling

**Estimated effort:** 2–3 hours

## Objective

Create the pnpm monorepo skeleton so the Express server and Next.js app boot together via one command, with strict TypeScript and shared tooling in place.

## Dependencies

None (first phase).

## Tasks

- [ ] Create `pnpm-workspace.yaml` declaring `packages/*`
- [ ] Root `package.json` with scripts: `dev` (concurrently server + web), `build`, `test`, `typecheck`, `lint`
- [ ] Root `.gitignore` (node_modules, .next, dist, *.db), `.editorconfig`, `.prettierrc`, ESLint flat config
- [ ] Base `tsconfig.base.json` with `strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
- [ ] `packages/shared`: package.json, tsconfig, empty `src/index.ts` placeholder
- [ ] `packages/server`: Express 5 + TypeScript (`tsx` for dev/watch), minimal `app.ts` returning `{ ok: true }` on `GET /health`
- [ ] `packages/web`: Next.js (App Router) + Tailwind, minimal home page, proxied API config via `next.config` (server on `:4000`, web on `:3000`)
- [ ] Wire `pnpm dev` with `concurrently`; add `dev:server` / `dev:web` / `dev:shared` granular scripts
- [ ] Verify `pnpm typecheck` passes in all packages (strict, zero errors)

## Deliverables

- Working monorepo with server + web running side by side
- Strict TS, lint, prettier configured once, used by all packages

## Definition of Done

- [ ] `pnpm dev` starts Express on `:4000` and Next on `:3000`; `GET /health` returns 200
- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm lint` exits 0

## Notes

- Node 26 is the runtime; pin engines in root package.json.
- Keep the web app dependency-light; UI components get introduced in Phase 8.
